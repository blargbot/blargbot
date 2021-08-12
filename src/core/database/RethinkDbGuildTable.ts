import { Logger } from '@core/Logger';
import { ChannelSettings, CommandPermissions, GuildAnnounceOptions, GuildAutoresponse, GuildAutoresponses, GuildCensors, GuildFilteredAutoresponse, GuildModlogEntry, GuildRolemeEntry, GuildTable, MutableStoredGuild, MutableStoredGuildEventLogConfig, NamedStoredGuildCommand, StoredGuild, StoredGuildCommand, StoredGuildEventLogConfig, StoredGuildEventLogType, StoredGuildSettings } from '@core/types';
import { guard } from '@core/utils';
import { Guild } from 'discord.js';

import { RethinkDb, RethinkDbCachedTable } from './base';

export class RethinkDbGuildTable extends RethinkDbCachedTable<'guild', 'guildid'> implements GuildTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('guild', 'guildid', rethinkDb, logger);
    }

    public async setAnnouncements(guildId: string, options: GuildAnnounceOptions | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, { announce: this.setExpr(options) }))
            return false;

        if (options === undefined)
            delete guild.announce;
        else
            guild.announce = options;
        return true;
    }

    public async getAnnouncements(guildId: string, skipCache?: boolean): Promise<GuildAnnounceOptions | undefined> {
        const guild = await this.rget(guildId, skipCache);
        if (guild === undefined)
            return undefined;

        return guild.announce;
    }

    public async clearVoteBans(guildId: string, userId?: string): Promise<void> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return;

        const success = userId === undefined
            ? await this.rupdate(guildId, this.updateExpr({ votebans: undefined }))
            : await this.rupdate(guildId, this.updateExpr({ votebans: { [userId]: undefined } }));

        if (!success)
            return;

        if (guild.votebans === undefined)
            return;

        if (userId === undefined)
            delete guild.votebans;
        else
            delete guild.votebans[userId];
    }

    public async getLogIgnores(guildId: string, skipCache?: boolean): Promise<ReadonlySet<string>> {
        const guild = await this.rget(guildId, skipCache);
        return new Set(guild?.logIgnore);
    }

    public async getLogChannel(guildId: string, type: StoredGuildEventLogType, skipCache?: boolean): Promise<string | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.log?.[type];
    }

    public async getLogChannels(guildId: string, skipCache?: boolean): Promise<StoredGuildEventLogConfig> {
        const guild = await this.rget(guildId, skipCache);

        const result: MutableStoredGuildEventLogConfig = { events: {}, roles: {} };
        for (const [key, value] of Object.entries(guild?.log ?? {})) {
            if (value === undefined)
                continue;
            if (key.startsWith('role:'))
                result.roles[key.slice(5)] = value;
            else
                result.events[key as Exclude<StoredGuildEventLogType, `role:${string}`>] = value;
        }
        return result;
    }

    public async getAutoresponses(guildId: string, skipCache?: boolean): Promise<GuildAutoresponses> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.autoresponse ?? {};
    }

    public async getAutoresponse(guildId: string, index: number, skipCache?: boolean): Promise<GuildFilteredAutoresponse | undefined>
    public async getAutoresponse(guildId: string, index: 'everything', skipCache?: boolean): Promise<GuildAutoresponse | undefined>
    public async getAutoresponse(guildId: string, index: number | 'everything', skipCache?: boolean): Promise<GuildAutoresponse | GuildFilteredAutoresponse | undefined>
    public async getAutoresponse(guildId: string, index: number | 'everything', skipCache?: boolean): Promise<GuildAutoresponse | GuildFilteredAutoresponse | undefined> {
        const guild = await this.rget(guildId, skipCache);
        if (guild?.autoresponse === undefined)
            return undefined;

        if (index === 'everything')
            return guild.autoresponse.everything;
        return guild.autoresponse.list?.[index];
    }

    public async setAutoresponse(guildId: string, index: number, autoresponse: GuildFilteredAutoresponse | undefined): Promise<boolean>
    public async setAutoresponse(guildId: string, index: 'everything', autoresponse: GuildAutoresponse | undefined): Promise<boolean>
    public async setAutoresponse(guildId: string, index: number | 'everything', autoresponse: undefined): Promise<boolean>
    public async setAutoresponse(...args:
        | [guildId: string, index: number, autoresponse: GuildFilteredAutoresponse | undefined]
        | [guildId: string, index: 'everything', autoresponse: GuildAutoresponse | undefined]
        | [guildId: string, index: number | 'everything', autoresponse: undefined]
    ): Promise<boolean> {
        const guildId = args[0];
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        guild.autoresponse ??= {};
        switch (typeof args[1]) {
            case 'string': {
                const [, , autoresponse] = <Extract<typeof args, { 1: string; }>>args;
                const success = await this.rupdate(guildId, { autoresponse: { everything: this.setExpr(autoresponse) } });
                if (!success)
                    return false;
                if (autoresponse === undefined)
                    delete guild.autoresponse.everything;
                else if (!('term' in autoresponse))
                    guild.autoresponse.everything = autoresponse;
                return true;
            }
            case 'number': {
                const [, index, autoresponse] = <Extract<typeof args, { 1: number; }>>args;
                const replacement = autoresponse === undefined ? [] : [autoresponse];
                const success = await this.rupdate(guildId, r => ({ autoresponse: { list: r.getField('autoresponse').default({})('list').default([]).spliceAt(index, this.addExpr(replacement)) } }));
                if (!success)
                    return false;
                guild.autoresponse.list ??= [];
                if (autoresponse === undefined)
                    guild.autoresponse.list.splice(index, 1);
                else if ('term' in autoresponse)
                    guild.autoresponse.list[index] = autoresponse;
                return true;
            }
        }
    }

    public async addAutoresponse(guildId: string, autoresponse: GuildFilteredAutoresponse): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, r => ({ autoresponse: { list: r.getField('autoresponse').default({})('list').default([]).append(this.addExpr(autoresponse)) } })))
            return false;

        guild.autoresponse ??= { list: [] };
        guild.autoresponse.list ??= [];
        guild.autoresponse.list.push(autoresponse);

        return true;
    }

    public async getChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, skipCache?: boolean): Promise<ChannelSettings[K] | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.channels[channelId]?.[key];
    }

    public async getRolemes(guildId: string, skipCache?: boolean): Promise<readonly GuildRolemeEntry[]> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.roleme ?? [];
    }

    public async getCensors(guildId: string, skipCache?: boolean): Promise<GuildCensors | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.censor;
    }

    public async getCommandPerms(guildId: string, commandName: string, skipCache = false): Promise<CommandPermissions | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.commandperms?.[commandName];
    }

    public async listCommands(guildId: string, skipCache = false): Promise<readonly NamedStoredGuildCommand[]> {
        const guild = await this.rget(guildId, skipCache);
        if (guild?.ccommands === undefined)
            return [];

        return Object.entries(guild.ccommands)
            .filter((v): v is [string, StoredGuildCommand] => guard.hasValue(v[1]))
            .map(v => ({ ...v[1], name: v[0] }));
    }

    public async get(guildId: string, skipCache = false): Promise<StoredGuild | undefined> {
        return await this.rget(guildId, skipCache);
    }

    public async upsert(guild: Guild): Promise<'inserted' | 'updated' | false> {
        const current = await this.rget(guild.id, true);
        if (current === undefined) {
            if (await this.rinsert({
                guildid: guild.id,
                active: true,
                name: guild.name,
                settings: {},
                channels: {},
                commandperms: {},
                ccommands: {},
                modlog: []
            })) {
                return 'inserted';
            }
        } else {
            const update: Partial<MutableStoredGuild> = {};
            if (!current.active)
                update.active = true;
            if (current.name !== guild.name)
                update.name = guild.name;

            if (Object.values(update).some(guard.hasValue) && await this.rupdate(guild.id, update))
                return 'updated';
        }

        return false;
    }

    public async exists(guildId: string, skipCache = false): Promise<boolean> {
        return await this.rget(guildId, skipCache) !== undefined;
    }

    public async isActive(guildId: string, skipCache = false): Promise<boolean> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.active ?? false;
    }

    public async setActive(guildId: string, active = true): Promise<boolean> {
        return await this.rupdate(guildId, this.updateExpr({ active }));
    }

    public async getIds(): Promise<string[]> {
        return await this.rqueryAll(t => t.getField('guildid'));
    }

    public async getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache = false): Promise<StoredGuildSettings[K] | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.settings[key];
    }

    public async setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, { settings: { [key]: this.setExpr(value) } }))
            return false;

        if (value === undefined)
            delete guild.settings[key];
        else
            guild.settings[key] = value;

        return true;
    }

    public async getCommand(guildId: string, commandName: string, skipCache = false): Promise<NamedStoredGuildCommand | undefined> {
        const guild = await this.rget(guildId, skipCache);
        commandName = commandName.toLowerCase();
        const command = guild?.ccommands[commandName];
        return command === undefined ? undefined : { ...command, name: commandName };
    }

    public async withIntervalCommand(): Promise<readonly string[]> {
        return await this.rqueryAll(t => t.getAll(true, { index: 'interval' }).getField('guildid'));
    }

    public async updateCommand(guildId: string, commandName: string, partialCommand: Partial<StoredGuildCommand>): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        commandName = commandName.toLowerCase();
        const command = guild.ccommands[commandName];
        if (command === undefined || !await this.rupdate(guildId, { ccommands: { [commandName]: this.updateExpr(partialCommand) } }))
            return false;

        Object.assign(command, partialCommand);
        return true;
    }

    public async setCommandProp<K extends keyof StoredGuildCommand>(guildId: string, commandName: string, key: K, value: StoredGuildCommand[K]): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        commandName = commandName.toLowerCase();

        const command = guild.ccommands[commandName];
        if (command === undefined || !await this.rupdate(guildId, { ccommands: { [commandName]: { [key]: this.setExpr(value) } } }))
            return false;

        if (value === undefined)
            delete command[key];
        else
            command[key] = value;
        return true;
    }

    public async setCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        commandName = commandName.toLowerCase();
        if (!await this.rupdate(guildId, { ccommands: { [commandName]: this.setExpr(command) } }))
            return false;

        if (command === undefined)
            delete guild.ccommands[commandName];
        else
            guild.ccommands[commandName] = command;

        return true;
    }

    public async renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        oldName = oldName.toLowerCase();
        newName = newName.toLowerCase();
        if (guild.ccommands[oldName] === undefined
            || guild.ccommands[newName] !== undefined
            || !await this.rupdate(guildId, r => ({ ccommands: { [newName]: r.getField('ccommands')(oldName), [oldName]: this.setExpr(undefined) } })))
            return false;

        guild.ccommands[newName] = guild.ccommands[oldName];
        delete guild.ccommands[oldName];
        return true;
    }

    public async getNewModlogCaseId(guildId: string, skipCache?: boolean): Promise<number | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.modlog?.length;
    }

    public async addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, r => ({ modlog: r.getField('modlog').default([]).append(this.addExpr(modlog)) })))
            return false;

        guild.modlog ??= [];
        guild.modlog.push(modlog);
        return true;
    }

    public async setLogIgnores(guildId: string, userIds: string[]): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, r => ({ logIgnore: r.getField('logIgnore').default([]).setUnion(userIds) })))
            return false;

        guild.logIgnore = [...new Set([...guild.logIgnore ?? [], ...userIds])];
        return true;
    }

    public async setLogChannel(guildId: string, events: StoredGuildEventLogType | StoredGuildEventLogType[], channel: string | undefined): Promise<boolean> {
        if (typeof events === 'string')
            events = [events];

        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        const logUpdate = events.reduce<{ [key: string]: string | undefined; }>((p, c) => {
            p[c] = channel;
            return p;
        }, {});

        if (!await this.rupdate(guildId, { log: this.updateExpr(logUpdate) }))
            return false;

        guild.log ??= {};
        for (const event of events) {
            if (channel === undefined)
                delete guild.log[event];
            else
                guild.log[event] = channel;
        }
        return true;
    }

    public async getWarnings(guildId: string, userId: string, skipCache?: boolean): Promise<number | undefined> {
        const guild = await this.rget(guildId, skipCache);
        if (guild === undefined)
            return undefined;

        return guild.warnings?.users?.[userId];
    }

    public async setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, { warnings: { users: { [userId]: this.setExpr(count) } } }))
            return false;

        const warnings = guild.warnings ??= {};
        const users = warnings.users ??= {};
        users[userId] = count;
        return true;
    }

    public async migrate(): Promise<void> {
        const indexes = await this.rquery(t => t.indexList());
        if (!indexes.includes('interval')) {
            await this.rquery(t => t.indexCreate('interval', r => r.getField('ccommands').hasFields('_interval')));
        }
    }
}
