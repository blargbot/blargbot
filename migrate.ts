/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'module-alias/register';

import config from '@config';
import { createLogger, Logger } from '@core/Logger';
import { GuildAutoresponses, GuildCommandTag, GuildFilteredAutoresponse, GuildRolemeEntry, GuildTriggerTag, MutableCommandPermissions, MutableGuildCensor, MutableGuildCensorRule, MutableStoredGuild, MutableStoredGuildSettings, StoredGuild } from '@core/types';
import { guard, mapping } from '@core/utils';
import { Client as Discord, Constants } from 'eris';
import * as r from 'rethinkdb';

void (async function () {
    // This is for migrating from the js blarg to the ts blarg
    const logger = createLogger(config, 'MIGRATE');

    const discord = new Discord(config.discord.token, {
        restMode: true,
        intents: []
    });

    const [rethink] = await Promise.all([
        r.connect({
            ...config.rethink,
            timeout: 10000
        })
    ]);

    const results = await Promise.allSettled([
        migrateChangelog(discord, rethink, logger),
        migrateGuilds(rethink, logger),
        migrateIntervalIndex(rethink, logger)
    ]);

    for (const result of results) {
        if (result.status === 'rejected')
            logger.error(result.reason);
    }

    process.exit();
})();

/** TS blarg now uses the news channel feature for changelogs. This subscribes all channels that were using the old method to the new one and then clears the DB */
async function migrateChangelog(discord: Discord, rethink: r.Connection, logger: Logger): Promise<void> {
    const changelogs = <{ guilds: Record<string, string>; } | undefined>await r.table('vars').get('changelog').run(rethink);
    const changelogChannel = await discord.getRESTChannel(config.discord.channels.changelog);
    if (changelogChannel.type !== Constants.ChannelTypes.GUILD_NEWS) {
        logger.error('[migrateChangelog] Cannot locate changelog news channel');
        return;
    }

    const unmigrated = { ...changelogs?.guilds ?? {} };
    for (const [guildId, channelId] of Object.entries(unmigrated)) {
        try {
            const channel = await discord.getRESTChannel(channelId);
            if (guard.isTextableChannel(channel)) {
                try {
                    await discord.followChannel(changelogChannel.id, channel.id);
                    await channel.createMessage('Hi! Ive recently received an update to how changelogs work. This channel was subscribed, so I have migrated it to the new method! You can unsubscribe by running `b!changelog unsubscribe`');
                } catch (ex: unknown) {
                    logger.error('[migrateChangelog] Guild:', guildId, 'Channel:', channelId, ex);
                    await channel.createMessage('Hi! Ive recently received an update to how changelogs work. This channel was subscribed, but I wasnt able to update it to the new method. Please run `b!changelog subscribe` to fix this!');
                }
            }
            delete unmigrated[guildId];
        } catch (ex: unknown) {
            logger.error('[migrateChangelog] Guild:', guildId, 'Channel:', channelId, ex);
        }
    }

    await r.table('vars').get('changelog').delete().run(rethink);

    const failed = Object.entries(unmigrated);
    const success = Object.keys(changelogs?.guilds ?? {}).length - failed.length;
    logger.info('[migrateChangelog] Complete.', success, 'channels updated.', failed.length, 'channels failed:', unmigrated);
}

async function migrateIntervalIndex(rethink: r.Connection, logger: Logger): Promise<void> {
    await r.table('guild').indexDrop('interval').run(rethink);
    await r.table<StoredGuild>('guild').indexCreate('interval', doc => doc.hasFields('interval')).run(rethink);
    logger.info('[migrateIntervalIndex] Complete');
}

async function migrateGuilds(rethink: r.Connection, logger: Logger): Promise<void> {
    const cursor = await r.table('guild').run(rethink);
    const promises: Array<[any, Promise<boolean | 'nochange'>]> = [];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
    while (true) {
        try {
            const guild = await cursor.next();
            promises.push([guild, migrateGuild(guild, rethink, logger)]);
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.')
                break;
            throw err;
        }
    }

    const results = await Promise.all(promises.map(async p => [p[0], await p[1]] as const));
    const succeeded = results.filter(r => r[1] === true);
    const failed = results.filter(r => r[1] === false).map(r => r[0]);
    const noChange = results.filter(r => r[1] === 'nochange');

    logger.info('[migrateGuilds] Complete', succeeded.length, 'guilds updated.', noChange.length, 'guilds needed no changes.', failed.length, 'guilds failed:', failed);
}

async function migrateGuild(guild: any, rethink: r.Connection, logger: Logger): Promise<boolean | 'nochange'> {
    const guildId = guild.guildid;
    if (typeof guildId !== 'string') {
        logger.error('Failed to update, cannot locate guild id', guild);
        return false;
    }

    const context: GuildMigrateContext = {
        ccommands: {},
        autoresponse: {},
        settings: {},
        censor: {},
        commandperms: {},
        update: {}
    };

    const changed = [
        migrateInterval(guildId, guild, logger, context),
        migrateGreeting(guildId, guild, logger, context, 'greeting'),
        migrateGreeting(guildId, guild, logger, context, 'farewell'),
        migrateEverythingAR(guildId, guild, logger, context),
        migrateFilteredARs(guildId, guild, logger, context),
        migrateCensors(guildId, guild, logger, context),
        migrateRolemes(guildId, guild, logger, context),
        migrateCommandPerms(guildId, guild, logger, context),
        migrateSettings(guildId, guild, logger, context)
    ].reduce((p, c) => c || p, false);

    if (changed) {
        try {
            await r.table('guild').get(guildId).update(context.update).run(rethink);
            logger.info('[migrateGuild]', guildId, 'succeeded');
            return true;
        } catch (err: unknown) {
            logger.error('[migrateGuild]', guildId, err);
            return false;
        }
    } else {
        logger.debug('[migrateGuild]', guildId, 'No changes');
        return 'nochange';
    }
}

function migrateInterval(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    const interval = guild.ccommands?.['_interval'];
    if (interval === undefined)
        return false;

    const mapped = mapGuildTriggerTag(interval);
    if (!mapped.valid) {
        logger.error('[migrateGuild]', guildId, 'migrating _interval failed: invalid ccommand');
        return false;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating _interval');
    context.update.interval = mapped.value;
    context.update.ccommands = context.ccommands;
    context.ccommands['_interval'] = nukedCC('b!interval set <bbtag>');
    return true;
}

function migrateGreeting(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext, key: 'greeting' | 'farewell'): boolean {
    const greeting = guild.settings?.[key];
    if (greeting === undefined)
        return false;

    const mapped = mapStringOrGuildTriggerTag(greeting);
    if (!mapped.valid) {
        logger.error('[migrateGuild]', guildId, 'migrating', key, 'failed: invalid ccommand');
        return false;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating', key);
    context.update.settings = context.settings;
    (<any>context.settings)[key] = r.literal();
    context.update[key] = typeof mapped.value === 'string'
        ? { content: mapped.value, author: '' }
        : mapped.value;
    return true;
}

function migrateEverythingAR(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    const everythingAr = guild.autoresponse?.everything?.executes;
    if (typeof everythingAr !== 'string')
        return false;

    const ccommand = guild.ccommands?.[everythingAr];
    if (ccommand === undefined) {
        context.update.autoresponse = context.autoresponse;
        context.autoresponse.everything = { executes: { content: '{//;This autoresponse hasnt been set yet!}', author: '' } };
        return true;
    }

    const mapped = mapGuildTriggerTag(ccommand);
    if (!mapped.valid) {
        logger.error('[migrateGuild]', guildId, 'migrating everything autoresponse failed: invalid ccommand');
        return false;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating everything autoresponse ', everythingAr);
    context.update.autoresponse = context.autoresponse;
    context.autoresponse.everything = { executes: mapped.value };
    context.update.ccommands = context.ccommands;
    context.ccommands[everythingAr] = nukedCC('b!ar set everything <bbtag>');
    return true;
}

function migrateFilteredARs(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    const arList = guild.autoresponse?.list;
    if (arList === undefined)
        return false;

    context.update.autoresponse = context.autoresponse;
    (<any>context.autoresponse).list = r.literal();

    if (!Array.isArray(arList)) {
        logger.error('[migrateGuild]', guildId, 'migrating autoresponse list failed: Not an array');
        return true;
    } else if (arList.length === 0)
        return true;

    const filtered = {} as r.UpdateData<Exclude<GuildAutoresponses['filtered'], undefined>>;

    let i = 0;
    for (const filteredAr of arList) {
        const migrated = migrateFilteredAR(guildId, guild, filteredAr, i, logger, context);
        if (migrated !== undefined) {
            context.autoresponse.filtered = filtered;
            filtered[i++] = migrated;
        }
    }

    return true;
}

function migrateFilteredAR(guildId: string, guild: any, ar: any, index: number, logger: Logger, context: GuildMigrateContext): GuildFilteredAutoresponse | undefined {
    const mappedAr = mapOldFilteredAr(ar);
    if (!mappedAr.valid) {
        logger.error('[migrateGuild]', guildId, 'migrating autoresponse', index, 'failed: invalid autoresponse');
        return undefined;
    }

    const ccommand = guild.ccommands?.[mappedAr.value.executes];
    if (ccommand === undefined) {
        logger.debug('[migrateGuild]', guildId, 'migrating autoresponse', index);
        return { ...mappedAr.value, executes: { content: '{//;This autoresponse hasnt been set yet!}', author: '' } };
    }

    const mappedCommand = mapGuildTriggerTag(ccommand);
    if (!mappedCommand.valid) {
        logger.error('[migrateGuild]', guildId, 'migrating autoresponse', index, 'failed: invalid ccommand');
        return undefined;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating autoresponse', index);
    context.ccommands[mappedAr.value.executes] = nukedCC(`b!ar set ${index} <bbtag>`);
    return { ...mappedAr.value, executes: mappedCommand.value };
}

function migrateCensors(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    if (guild.censor === undefined)
        return false;

    let changed = false;

    if (guild.censor.rule !== undefined) {
        const rule = {} as r.UpdateData<MutableGuildCensorRule>;
        for (const key of ['deleteMessage', 'banMessage', 'kickMessage'] as const) {
            if (guild.censor.rule[key] !== undefined) {
                logger.debug('[migrateGuild]', guildId, 'migrating censor rule', key);
                context.update.censor = context.censor;
                context.censor.rule = rule;
                rule[key] = { content: guild.censor.rule[key] };
                changed = true;
            }
        }
    }

    if (guild.censor.list !== undefined) {
        if (!Array.isArray(guild.censor.list)) {
            logger.error('[migrateGuild]', guildId, 'migrating censor list: not an array');
        } else if (guild.censor.list.length > 0) {
            const list = (<any[]>guild.censor.list).reduce<Record<string, MutableGuildCensor>>((record, censor, i) => {
                const update = record[i] = { ...censor } as MutableGuildCensor;
                for (const key of ['deleteMessage', 'banMessage', 'kickMessage'] as const) {
                    if (censor[key] !== undefined) {
                        logger.debug('[migrateGuild]', guildId, 'migrating censor list', i, key);
                        update[key] = { content: censor[key], author: '' };
                    }
                }
                return record;
            }, {});

            try {
                context.censor.list = r.literal(list);
                context.update.censor = context.censor;
                changed = true;
            } catch (err: unknown) {
                logger.error('[migrateGuild]', guildId, 'migrating censor list failed: r.literal(list) error', err);
            }
        }
    }

    return changed;
}

function migrateRolemes(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    const roleme = guild.roleme;
    if (roleme === undefined)
        return false;

    if (!Array.isArray(roleme)) {
        logger.error('[migrateGuild]', guildId, 'migrating rolemes: Not an array');
        return false;
    } else if (roleme.length === 0)
        return false;

    let changed = false as boolean;
    const update = (<any[]>roleme).reduce<Record<string, GuildRolemeEntry>>((record, roleme: any, i) => {
        const update = record[i] = { ...roleme } as Mutable<GuildRolemeEntry>;

        if (typeof roleme.output === 'string') {
            logger.debug('[migrateGuild]', guildId, 'migrating roleme', i);
            changed = true;
            update.output = { content: roleme.output, author: '' };
        }

        return record;
    }, {});

    if (!changed)
        return false;

    try {
        context.update.roleme = r.literal(update);
        return true;
    } catch (err: unknown) {
        logger.error('[migrateGuild]', guildId, 'migrating rolemes failed: r.literal(update) error', err);
        return false;
    }
}

function migrateCommandPerms(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    const commandPerms = guild.commandperms;
    if (commandPerms === undefined)
        return false;

    let changed = false;

    for (const [commandName, perms] of Object.entries<PropertyKey, any>(commandPerms)) {
        const newPerm: r.UpdateData<MutableCommandPermissions> = {};
        switch (typeof perms.permission) {
            case 'object': // null
                changed = true;
                newPerm.permission = r.literal();
                break;
            case 'number':
                logger.debug('[migrateGuild]', guildId, 'migrating command', commandName, 'permissions');
                changed = true;
                newPerm.permission = perms.permission.toString();
                break;
        }

        if (perms.rolename === null) {
            changed = true;
            (<any>newPerm).rolename = r.literal();
        } else if (Array.isArray(perms.rolename)) {
            changed = true;
            logger.debug('[migrateGuild]', guildId, 'migrating command', commandName, 'roles');
            newPerm.roles = perms.rolename;
            (<any>newPerm).rolename = r.literal();
        }

        if (Object.keys(newPerm).length > 0)
            context.commandperms[commandName] = newPerm;
    }

    if (changed)
        context.update.commandperms = context.commandperms;

    return changed;
}

function migrateSettings(guildId: string, guild: any, logger: Logger, context: GuildMigrateContext): boolean {
    const settings = guild.settings;
    if (settings === undefined)
        return false;

    let changed = false;
    const newSettings: Partial<MutableStoredGuildSettings> = {};

    if (typeof settings.staffperms === 'number') {
        logger.debug('[migrateGuild]', guildId, 'migrating setting staffperms');
        changed = true;
        newSettings.staffperms = settings.staffperms.toString();
    }

    if (typeof settings.kickoverride === 'number') {
        logger.debug('[migrateGuild]', guildId, 'migrating setting kickoverride');
        changed = true;
        newSettings.kickoverride = settings.kickoverride.toString();
    }

    if (typeof settings.banoverride === 'number') {
        logger.debug('[migrateGuild]', guildId, 'migrating setting banoverride');
        changed = true;
        newSettings.banoverride = settings.banoverride.toString();
    }

    if (changed)
        context.update.settings = context.settings;

    return changed;
}

const mapGuildTriggerTag = mapping.object<GuildTriggerTag>({
    author: mapping.string,
    authorizer: mapping.string.optional,
    content: mapping.string
});

const mapStringOrGuildTriggerTag = mapping.choice(
    mapping.string,
    mapping.object<GuildTriggerTag>({
        author: mapping.string,
        authorizer: mapping.string.optional,
        content: mapping.string
    })
);

const mapOldFilteredAr = mapping.object({
    executes: mapping.string,
    term: mapping.string,
    regex: mapping.boolean
});

function nukedCC(newLocation: string): r.UpdateData<GuildCommandTag> {
    return {
        content: `{//;This ccommand has been moved. To update it, use the \`${newLocation}\` command}`,
        author: '',
        authorizer: r.literal(),
        cooldown: r.literal(),
        flags: r.literal(),
        help: r.literal(),
        hidden: true,
        roles: r.literal()
    };
}

interface GuildMigrateContext {
    censor: r.UpdateData<Exclude<MutableStoredGuild['censor'], undefined>>;
    ccommands: r.UpdateData<MutableStoredGuild['ccommands']>;
    settings: r.UpdateData<MutableStoredGuild['settings']>;
    autoresponse: r.UpdateData<Exclude<MutableStoredGuild['autoresponse'], undefined>>;
    commandperms: r.UpdateData<Exclude<MutableStoredGuild['commandperms'], undefined>>;
    update: r.UpdateData<MutableStoredGuild>;
}
