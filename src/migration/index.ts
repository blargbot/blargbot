import { guard } from '@blargbot/cluster/utils';
import { config } from '@blargbot/config';
import { CommandPermissions, GuildAutoresponses, GuildCensor, GuildCensorRule, GuildCommandTag, GuildRolemeEntry, GuildTriggerTag, StoredGuild, StoredGuildSettings } from '@blargbot/domain/models';
import { createLogger, Logger } from '@blargbot/logger';
import { Client as Discord, Constants } from 'eris';
import * as r from 'rethinkdb';

import { mapGuild, OldRethinkGuild } from './guild.mapping';

void (async function () {
    // This is for migrating from the js blarg to the ts blarg
    const logger = createLogger(config, 'MIGRATE');

    const discord = new Discord(config.discord.token, {
        restMode: true,
        intents: []
    });

    const rethink = await r.connect({
        ...config.rethink,
        timeout: 10000
    });

    await logErrors(migrateChangelog(discord, rethink, logger), logger);
    await logErrors(migrateGuilds(rethink, logger), logger);
    await logErrors(migrateIntervalIndex(rethink, logger), logger);

    process.exit();
})();

async function logErrors(promise: Promise<void>, logger: Logger): Promise<void> {
    try {
        await promise;
    } catch (err: unknown) {
        logger.error(err);
    }
}

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
    const promises: Array<[OldRethinkGuild, Promise<boolean | 'nochange'>]> = [];
    for await (const next of iterCursor(cursor)) {
        const guild = mapGuild(next);
        if (guild.valid)
            promises.push([guild.value, migrateGuild(guild.value, rethink, logger)]);
        else
            logger.warn('Failed to update, could not understand as a guild. This could be because it is already migrated', next);
    }

    const results = await Promise.all(promises.map(async p => [p[0], await p[1]] as const));
    const succeeded = results.filter(r => r[1] === true);
    const failed = results.filter(r => r[1] === false).map(r => r[0]);
    const noChange = results.filter(r => r[1] === 'nochange');

    logger.info('[migrateGuilds] Complete', succeeded.length, 'guilds updated.', noChange.length, 'guilds needed no changes.', failed.length, 'guilds failed:', failed);
}

async function migrateGuild(guild: OldRethinkGuild, rethink: r.Connection, logger: Logger): Promise<boolean | 'nochange'> {
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
        migrateEverythingAr(guildId, guild, logger, context),
        migrateFilteredArs(guildId, guild, logger, context),
        migrateCensors(guildId, guild, logger, context),
        migrateRolemes(guildId, guild, logger, context),
        migrateCommandPerms(guildId, guild, logger, context),
        migrateSettings(guildId, guild, logger, context)
    ].reduce((p, c) => c || p, false);

    if (changed) {
        try {
            await r.table('guild').get(guildId).update(stripUndef(context.update)).run(rethink);
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

function migrateInterval(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    const interval = guild.ccommands._interval;
    if (interval === undefined)
        return false;

    if (interval.author === undefined) {
        logger.error('[migrateGuild]', guildId, 'migrating _interval failed: missing author');
        return false;
    }
    if (interval.content === undefined) {
        logger.error('[migrateGuild]', guildId, 'migrating _interval failed: missing content');
        return false;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating _interval');
    setProp(context.update, 'interval', {
        author: interval.author,
        authorizer: interval.authorizer,
        content: interval.content
    });
    setProp(context.update, 'ccommands', context.ccommands);
    context.ccommands['_interval'] = nukedCC('b!interval set <bbtag>');
    return true;
}

function migrateGreeting(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext, key: 'greeting' | 'farewell'): boolean {
    const value = guild.settings[key];
    if (value === undefined)
        return false;

    logger.debug('[migrateGuild]', guildId, 'migrating', key);
    setProp(context.update, 'settings', context.settings);
    setProp(context.settings, key as keyof StoredGuildSettings, r.literal());
    setProp(context.update, key, typeof value === 'string'
        ? { content: value, author: '' }
        : value
    );
    return true;
}

function migrateEverythingAr(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    const everythingAr = guild.autoresponse?.everything?.executes;
    if (everythingAr === undefined)
        return false;

    const ccommand = guild.ccommands[everythingAr];
    if (ccommand === undefined) {
        setProp(context.update, 'autoresponse', context.autoresponse);
        setProp(context.autoresponse, 'everything', { content: '{//;This autoresponse hasnt been set yet!}', author: '' });
        return true;
    }

    if (ccommand.author === undefined) {
        logger.error('[migrateGuild]', guildId, 'migrating everything autoresponse failed: missing author');
        return false;
    }
    if (ccommand.content === undefined) {
        logger.error('[migrateGuild]', guildId, 'migrating everything autoresponse failed: missing content');
        return false;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating everything autoresponse ', everythingAr);
    setProp(context.update, 'autoresponse', context.autoresponse);
    setProp(context.autoresponse, 'everything', {
        author: ccommand.author,
        authorizer: ccommand.authorizer,
        content: ccommand.content
    });
    setProp(context.update, 'ccommands', context.ccommands);
    context.ccommands[everythingAr] = nukedCC('b!ar set everything <bbtag>');
    return true;
}

function migrateFilteredArs(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    const arList = guild.autoresponse?.list;
    if (arList === undefined)
        return false;

    setProp(context.update, 'autoresponse', context.autoresponse);
    (<Record<string, unknown>>context.autoresponse).list = r.literal();

    const filtered = {} as r.UpdateData<Exclude<GuildAutoresponses['filtered'], undefined>>;

    let i = 0;
    for (const filteredAr of arList) {
        const migrated = migrateFilteredAr(guildId, guild, filteredAr, i, logger, context);
        if (migrated !== undefined) {
            setProp(context.autoresponse, 'filtered', filtered);
            filtered[i++] = migrated;
        }
    }

    return true;
}

function migrateFilteredAr(guildId: string, guild: OldRethinkGuild, ar: { executes: string; regex: boolean; term: string; }, index: number, logger: Logger, context: GuildMigrateContext): GuildTriggerTag | undefined {
    const ccommand = guild.ccommands[ar.executes];
    if (ccommand === undefined) {
        logger.debug('[migrateGuild]', guildId, 'migrating autoresponse', index);
        return { ...ar, content: '{//;This autoresponse hasnt been set yet!}', author: '' };
    }

    if (ccommand.author === undefined) {
        logger.error('[migrateGuild]', guildId, 'migrating autoresponse', index, 'failed: missing author');
        return undefined;
    }

    if (ccommand.content === undefined) {
        logger.error('[migrateGuild]', guildId, 'migrating autoresponse', index, 'failed: missing content');
        return undefined;
    }

    logger.debug('[migrateGuild]', guildId, 'migrating autoresponse', index);
    context.ccommands[ar.executes] = nukedCC(`b!ar set ${index} <bbtag>`);
    return {
        ...ar,
        author: ccommand.author,
        content: ccommand.content,
        authorizer: ccommand.authorizer
    };
}

function migrateCensors(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    let changed = false;

    const rules = guild.censor?.rule;
    if (rules !== undefined) {
        const rule = {} as Mutable<Partial<GuildCensorRule>>;
        for (const key of ['deleteMessage', 'banMessage', 'kickMessage'] as const) {
            const content = rules[key];
            if (typeof content === 'string') {
                logger.debug('[migrateGuild]', guildId, 'migrating censor rule', key);
                setProp(context.update, 'censor', context.censor);
                setProp(context.censor, 'rule', rule);
                rule[key] = { content: content, author: '' };
                changed = true;
            }
        }
    }

    const list = guild.censor?.list;
    if (list !== undefined) {
        const newList = Object.values(list)
            .reduce<Record<string, Mutable<GuildCensor>>>((record, censor, i) => {
                record[i] = {
                    ...censor,
                    deleteMessage: undefined,
                    banMessage: undefined,
                    kickMessage: undefined
                };
                for (const key of ['deleteMessage', 'banMessage', 'kickMessage'] as const) {
                    const content = censor[key];
                    if (content !== undefined) {
                        logger.debug('[migrateGuild]', guildId, 'migrating censor list', i, key);
                        record[i][key] = { content, author: '' };
                    }
                }
                return record;
            }, {});

        try {
            setProp(context.censor, 'list', r.literal(stripUndef(newList)));
            setProp(context.update, 'censor', context.censor);
            changed = true;
        } catch (err: unknown) {
            logger.error('[migrateGuild]', guildId, 'migrating censor list failed: r.literal(list) error', err);
        }
    }

    return changed;
}

function migrateRolemes(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    if (guild.roleme === undefined)
        return false;

    let changed = Array.isArray(guild.roleme);
    const update = Object.values(guild.roleme)
        .reduce<Record<string, Mutable<GuildRolemeEntry>>>((record, roleme, i) => {
            record[i] = {
                add: roleme.add,
                casesensitive: roleme.casesensitive,
                channels: roleme.channels,
                message: roleme.message,
                remove: roleme.remove
            };

            if (typeof roleme.output === 'string') {
                logger.debug('[migrateGuild]', guildId, 'migrating roleme', i);
                changed = true;
                record[i].output = { content: roleme.output, author: '' };
            }

            return record;
        }, {});

    if (!changed)
        return false;

    try {
        setProp(context.update, 'roleme', r.literal(stripUndef(update)));
        return true;
    } catch (err: unknown) {
        logger.error('[migrateGuild]', guildId, 'migrating rolemes failed: r.literal(update) error', err);
        return false;
    }
}

function migrateCommandPerms(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    let changed = false;
    for (const [commandName, perms] of Object.entries(guild.commandperms)) {
        const newPerm: r.UpdateData<Mutable<CommandPermissions>> = {};
        if (perms === undefined)
            continue;

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
            (<Record<string, unknown>>newPerm).rolename = r.literal();
        } else if (perms.rolename !== undefined) {
            changed = true;
            logger.debug('[migrateGuild]', guildId, 'migrating command', commandName, 'roles');
            newPerm.roles = Object.values(perms.rolename).filter((v): v is string => typeof v === 'string');
            (<Record<string, unknown>>newPerm).rolename = r.literal();
        }

        if (Object.keys(newPerm).length > 0)
            context.commandperms[commandName] = newPerm;
    }

    if (changed)
        setProp(context.update, 'commandperms', context.commandperms);

    return changed;
}

function migrateSettings(guildId: string, guild: OldRethinkGuild, logger: Logger, context: GuildMigrateContext): boolean {
    let changed = false;

    if (guild.settings.staffperms !== undefined) {
        logger.debug('[migrateGuild]', guildId, 'migrating setting staffperms');
        changed = true;
        setProp(context.settings, 'staffperms', guild.settings.staffperms.toString());
    }

    if (guild.settings.kickoverride !== undefined) {
        logger.debug('[migrateGuild]', guildId, 'migrating setting kickoverride');
        changed = true;
        setProp(context.settings, 'kickoverride', guild.settings.kickoverride.toString());
    }

    if (guild.settings.banoverride !== undefined) {
        logger.debug('[migrateGuild]', guildId, 'migrating setting banoverride');
        changed = true;
        setProp(context.settings, 'banoverride', guild.settings.banoverride.toString());
    }

    if (changed)
        setProp(context.update, 'settings', context.settings);

    return changed;
}

function nukedCC(newLocation: string): r.Expression<GuildCommandTag> {
    return r.literal({
        content: `{//;This ccommand has been moved. To update it, use the \`${newLocation}\` command}`,
        author: '',
        hidden: true
    });
}

async function* iterCursor<T>(cursor: r.Cursor<T>): AsyncIterable<T> {
    while (true) {
        try {
            yield await cursor.next();
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.')
                break;
            throw err;
        }
    }
}

function stripUndef<T>(value: T): T {
    for (const [key, val] of Object.entries(value)) {
        if (val === undefined)
            delete (<Record<string, unknown>>value)[key];
        else if (typeof val === 'object' && val !== null)
            stripUndef(val);
    }
    return value;
}

interface GuildMigrateContext {
    censor: r.UpdateData<Exclude<StoredGuild['censor'], undefined>>;
    ccommands: r.UpdateData<StoredGuild['ccommands']>;
    settings: r.UpdateData<StoredGuild['settings']>;
    autoresponse: r.UpdateData<Exclude<StoredGuild['autoresponse'], undefined>>;
    commandperms: r.UpdateData<Exclude<StoredGuild['commandperms'], undefined>>;
    update: r.UpdateData<StoredGuild>;
}

function setProp<Target, Key extends keyof Target>(target: Target, key: Key, value: Target[Key]): void {
    target[key] = value;
}
