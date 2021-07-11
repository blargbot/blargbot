import { GuildModlogEntry, StoredGuildSettings, StoredGuild, StoredGuildCommand, NamedStoredGuildCommand, CommandPermissions, ChannelSettings, GuildAutoresponses, GuildRolemeEntry, GuildCensors, MutableStoredGuild, GuildAutoresponse, GuildFilteredAutoresponse } from './types';
import { GuildTable } from './types';
import { RethinkDbCachedTable, RethinkDb } from './core';
import { guard } from '../utils';
import { Logger } from '../Logger';

export class RethinkDbGuildTable extends RethinkDbCachedTable<'guild', 'guildid'> implements GuildTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('guild', 'guildid', rethinkDb, logger);
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
                const success = await this.rupdate(guildId, r => ({ autoresponse: { list: r.row('autoresponse').default({})('list').default([]).spliceAt(index, this.addExpr([autoresponse])) } }));
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

        if (!await this.rupdate(guildId, r => ({ autoresponse: { list: r.row('autoresponse').default({})('list').default([]).append(this.addExpr(autoresponse)) } })))
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

    public async add(guild: MutableStoredGuild): Promise<boolean> {
        return await this.rinsert(guild);
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
            || !await this.rupdate(guildId, r => ({ ccommands: { [newName]: r.row('ccommands')(oldName), [oldName]: this.setExpr(undefined) } })))
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

        if (!await this.rupdate(guildId, r => ({ modlog: r.row('modlog').default([]).append(this.updateExpr(modlog)) }))) {
            return false;
        }

        guild.modlog ??= [];
        guild.modlog.push(modlog);
        return true;
    }

    public async setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (guild === undefined)
            return false;

        if (!await this.rupdate(guildId, { log: { [event]: this.setExpr(channel) } }))
            return false;

        guild.log ??= {};
        if (channel === undefined)
            delete guild.log[event];
        else
            guild.log[event] = channel;
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
            await this.rquery((t, r) => t.indexCreate('interval', r.row('ccommands').hasFields('_interval')));
        }
    }
}
