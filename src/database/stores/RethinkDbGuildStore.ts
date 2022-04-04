import { guard } from '@blargbot/core/utils';
import { ChannelSettings, CommandPermissions, GuildAnnounceOptions, GuildAutoresponses, GuildCensor, GuildCensorExceptions, GuildCensors, GuildCommandTag, GuildDetails, GuildFilteredAutoresponse, GuildModlogEntry, GuildRolemeEntry, GuildTriggerTag, GuildVotebans, NamedGuildCommandTag, StoredGuild, StoredGuildEventLogConfig, StoredGuildEventLogType, StoredGuildSettings } from '@blargbot/domain/models';
import { GuildStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import { UpdateData } from 'rethinkdb';

import { RethinkDb } from '../clients';
import { RethinkDbCachedTable } from '../tables/RethinkDbCachedTable';

export class RethinkDbGuildStore implements GuildStore {
    readonly #table: RethinkDbCachedTable<StoredGuild, 'guildid'>;

    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger,
        shouldCache: (id: string) => boolean
    ) {
        this.#table = new RethinkDbCachedTable('guild', 'guildid', rethinkDb, logger);
        this.#table.watchChanges(shouldCache);
    }

    async #getRootProp<Key extends keyof StoredGuild>(prop: Key, guildId: string, skipCache?: boolean): Promise<StoredGuild[Key] | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.[prop];
    }

    async #setRootProp<Key extends OptionalProperties<StoredGuild>>(prop: Key, guildId: string, value: StoredGuild[Key]): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, { [prop]: this.#table.setExpr(value) }))
            return false;

        setProp(guild, prop, value);

        return true;
    }

    public getInterval(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined> {
        return this.#getRootProp('interval', guildId, skipCache);
    }

    public setInterval(guildId: string, interval: GuildTriggerTag | undefined): Promise<boolean> {
        return this.#setRootProp('interval', guildId, interval);
    }

    public getFarewell(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined> {
        return this.#getRootProp('farewell', guildId, skipCache);
    }

    public setFarewell(guildId: string, farewell: GuildTriggerTag | undefined): Promise<boolean> {
        return this.#setRootProp('farewell', guildId, farewell);
    }

    public getGreeting(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined> {
        return this.#getRootProp('greeting', guildId, skipCache);
    }

    public setGreeting(guildId: string, greeting: GuildTriggerTag | undefined): Promise<boolean> {
        return this.#setRootProp('greeting', guildId, greeting);
    }

    public getAnnouncements(guildId: string, skipCache?: boolean): Promise<GuildAnnounceOptions | undefined> {
        return this.#getRootProp('announce', guildId, skipCache);
    }

    public setAnnouncements(guildId: string, options: GuildAnnounceOptions | undefined): Promise<boolean> {
        return this.#setRootProp('announce', guildId, options);
    }

    public async clearVoteBans(guildId: string, userId?: string): Promise<void> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return;

        const success = userId === undefined
            ? await this.#table.update(guildId, this.#table.updateExpr({ votebans: undefined }))
            : await this.#table.update(guildId, this.#table.updateExpr({ votebans: { [userId]: undefined } }));

        if (!success)
            return;

        if (guild.votebans === undefined)
            return;

        if (userId === undefined)
            setProp(guild, 'votebans', undefined);
        else
            setProp(guild.votebans, userId, undefined);
    }

    public async getVoteBans(guildId: string, skipCache?: boolean): Promise<GuildVotebans | undefined>
    public async getVoteBans(guildId: string, target: string, skipCache?: boolean): Promise<readonly string[] | undefined>
    public async getVoteBans(...args: [string, boolean?] | [string, string, boolean?]): Promise<GuildVotebans | readonly string[] | undefined> {
        let guildId: string;
        let target: string | undefined;
        let skipCache: boolean | undefined;

        switch (args.length) {
            case 1:
                [guildId, skipCache] = args;
                break;
            case 3:
                [guildId, target, skipCache] = args;
                break;
            case 2:
                if (typeof args[1] === 'string')
                    [guildId, target, skipCache] = args;
                else
                    [guildId, skipCache] = args;
                break;
        }

        const guild = await this.#table.get(guildId, skipCache);
        if (guild === undefined)
            return undefined;

        if (target !== undefined)
            return guild.votebans?.[target]?.map(vb => vb.id);

        return guild.votebans ?? {};
    }

    public async hasVoteBanned(guildId: string, target: string, signee: string, skipCache?: boolean): Promise<boolean> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild === undefined)
            return false;

        return guild.votebans?.[target]?.some(vb => vb.id === signee) ?? false;
    }

    public async addVoteBan(guildId: string, target: string, signee: string, reason?: string): Promise<number | false> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        const updated = await this.#table.update(guildId, g => ({
            votebans: {
                [target]: this.#table.branchExpr(g('votebans').default({})(target).default([]),
                    x => x.getField('id').contains(signee).not(),
                    x => x.append(this.#table.addExpr({ id: signee, reason }))
                )
            }
        }));

        if (!updated)
            return false;

        const vb = setIfUndefined(guild, 'votebans', {});
        const votes = setIfUndefined(vb, target, []);
        if (!votes.some(vb => vb.id === signee))
            push(votes, { id: signee, reason });
        return votes.length;
    }

    public async removeVoteBan(guildId: string, target: string, signee: string): Promise<number | false> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        const updated = await this.#table.update(guildId, g => ({
            votebans: {
                [target]: g('votebans').default({})(target).default([]).filter(b => b('id').eq(signee))
            }
        }));

        if (!updated)
            return false;

        const vb = setIfUndefined(guild, 'votebans', {});
        const votes = setProp(vb, target, vb[target]?.filter(s => s.id !== signee));
        return votes?.length ?? 0;

    }

    public async getLogIgnores(guildId: string, skipCache?: boolean): Promise<ReadonlySet<string>> {
        const guild = await this.#table.get(guildId, skipCache);
        return new Set(guild?.logIgnore);
    }

    public async getLogChannel(guildId: string, type: StoredGuildEventLogType, skipCache?: boolean): Promise<string | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.log?.[type];
    }

    public async getLogChannels(guildId: string, skipCache?: boolean): Promise<StoredGuildEventLogConfig> {
        const guild = await this.#table.get(guildId, skipCache);

        const result: StoredGuildEventLogConfig = { events: {}, roles: {} };
        for (const [key, value] of Object.entries(guild?.log ?? {})) {
            if (value === undefined)
                continue;
            if (key.startsWith('role:'))
                setProp(result.roles, key.slice(5), value);
            else
                setProp(result.events, key, value);
        }
        return result;
    }

    public async getAutoresponses(guildId: string, skipCache?: boolean): Promise<GuildAutoresponses> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.autoresponse ?? {};
    }

    public async getAutoresponse(guildId: string, id: number, skipCache?: boolean): Promise<GuildFilteredAutoresponse | undefined>
    public async getAutoresponse(guildId: string, id: 'everything', skipCache?: boolean): Promise<GuildTriggerTag | undefined>
    public async getAutoresponse(guildId: string, id: number | 'everything', skipCache?: boolean): Promise<GuildTriggerTag | GuildFilteredAutoresponse | undefined>
    public async getAutoresponse(guildId: string, id: number | 'everything', skipCache?: boolean): Promise<GuildTriggerTag | GuildFilteredAutoresponse | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild?.autoresponse === undefined)
            return undefined;

        if (id === 'everything')
            return guild.autoresponse.everything;

        return guild.autoresponse.filtered?.[id];
    }

    public async setAutoresponse(guildId: string, id: number, autoresponse: GuildFilteredAutoresponse | undefined): Promise<boolean>
    public async setAutoresponse(guildId: string, id: 'everything', autoresponse: GuildTriggerTag | undefined): Promise<boolean>
    public async setAutoresponse(guildId: string, id: number | 'everything', autoresponse: undefined): Promise<boolean>
    public async setAutoresponse(...args:
        | readonly [guildId: string, index: number, autoresponse: GuildFilteredAutoresponse | undefined]
        | readonly [guildId: string, index: 'everything', autoresponse: GuildTriggerTag | undefined]
        | readonly [guildId: string, index: number | 'everything', autoresponse: undefined]
    ): Promise<boolean> {
        const [guildId, index, autoresponse] = args;
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        const ar = setIfUndefined(guild, 'autoresponse', {});
        switch (index) {
            case 'everything': {
                if (!await this.#table.update(guildId, { autoresponse: { everything: this.#table.setExpr(autoresponse) } }))
                    return false;

                setProp(ar, 'everything', autoresponse);
                return true;
            }
            default: {
                if (!await this.#table.update(guildId, { autoresponse: { filtered: { [index]: this.#table.setExpr(autoresponse) } } }))
                    return false;

                const filtered = setIfUndefined(ar, 'filtered', {});
                setProp(filtered, index, autoresponse);
                return true;
            }
        }
    }

    public async getChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, skipCache?: boolean): Promise<ChannelSettings[K] | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.channels[channelId]?.[key];
    }

    public async setChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, value: ChannelSettings[K]): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, { channels: { [channelId]: { [key]: this.#table.setExpr(value) } } }))
            return false;

        const channels = setIfUndefined(guild, 'channels', {});
        const channel = setIfUndefined(channels, channelId, {});
        setProp(channel, key, value);
        return true;
    }

    public async getRolemes(guildId: string, skipCache?: boolean): Promise<{ readonly [id: string]: GuildRolemeEntry | undefined; } | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.roleme;
    }

    public async getRoleme(guildId: string, id: number, skipCache?: boolean): Promise<GuildRolemeEntry | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.roleme?.[id];
    }

    public async setRoleme(guildId: string, id: number, roleme: GuildRolemeEntry | undefined): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, { roleme: { [id.toString()]: this.#table.setExpr(roleme) } }))
            return false;

        const gr = setIfUndefined(guild, 'roleme', {});
        setProp(gr, id, roleme);
        return true;
    }

    public async getCensors(guildId: string, skipCache?: boolean): Promise<GuildCensors | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.censor;
    }

    public async getCensor(guildId: string, id: number, skipCache?: boolean): Promise<GuildCensor | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.censor?.list?.[id];
    }

    public async setCensor(guildId: string, id: number, censor: GuildCensor | undefined): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, { censor: { list: { [id]: this.#table.setExpr(censor) } } }))
            return false;

        const censors = setIfUndefined(guild, 'censor', {});
        const list = setIfUndefined(censors, 'list', {});
        setProp(list, id, censor);
        return true;
    }

    public async censorIgnoreUser(guildId: string, userId: string, ignored: boolean): Promise<boolean> {
        return await this.censorIgnoreCore(guildId, 'user', userId, ignored);
    }

    public async censorIgnoreChannel(guildId: string, channelId: string, ignored: boolean): Promise<boolean> {
        return await this.censorIgnoreCore(guildId, 'channel', channelId, ignored);
    }

    public async censorIgnoreRole(guildId: string, roleId: string, ignored: boolean): Promise<boolean> {
        return await this.censorIgnoreCore(guildId, 'role', roleId, ignored);
    }

    private async censorIgnoreCore(guildId: string, type: keyof GuildCensorExceptions, id: string, ignored: boolean): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        const success = await this.#table.update(guildId, g => {
            const exceptions = g.getField('censor').default({ list: {} })
                .getField('exception').default({ user: [], role: [], channel: [] })
                .getField(type).default([]);
            return {
                censor: {
                    exception: {
                        [type]: ignored ? exceptions.setInsert(id) : exceptions.setDifference(this.#table.expr([id]))
                    }
                }
            };
        });

        if (!success)
            return false;

        const censors = setIfUndefined(guild, 'censor', {});
        const exceptions = setIfUndefined(censors, 'exception', {});
        const excluded = new Set(exceptions[type]);

        if (ignored)
            excluded.delete(id);
        else
            excluded.add(id);

        setProp(exceptions, type, [...excluded]);
        return true;
    }

    public async setCensorRule(guildId: string, id: number | undefined, ruleType: 'delete' | 'kick' | 'ban', code: GuildTriggerTag | undefined): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (id !== undefined && guild.censor?.list?.[id] === undefined)
            return false;

        const ruleMessage = `${ruleType}Message` as const;
        const success = id === undefined
            ? await this.#table.update(guildId, { censor: { rule: { [ruleMessage]: this.#table.setExpr(code) } } })
            : await this.#table.update(guildId, { censor: { list: { [id]: { [ruleMessage]: this.#table.setExpr(code) } } } });
        if (!success)
            return false;

        if (code === undefined) {
            if (id === undefined) {
                delete guild.censor?.rule?.[ruleMessage];
            } else {
                const censor = guild.censor?.list?.[id];
                delete censor?.[ruleMessage];
            }
        } else if (id === undefined) {
            if (guild.censor?.rule?.[ruleMessage] !== undefined)
                setProp(guild.censor.rule, ruleMessage, code);
        } else {
            const censor = guild.censor?.list?.[id];
            if (censor !== undefined)
                setProp(censor, ruleMessage, code);
        }

        return true;
    }

    public async getCensorRule(guildId: string, id: number | undefined, ruleType: 'delete' | 'kick' | 'ban', skipCache?: boolean): Promise<GuildTriggerTag | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        const ruleMessage = `${ruleType}Message` as const;
        if (id === undefined)
            return guild?.censor?.rule?.[ruleMessage];

        const censor = guild?.censor?.list?.[id];
        return censor?.[ruleMessage];
    }

    public async getCommandPerms(guildId: string, skipCache?: boolean): Promise<Readonly<Record<string, CommandPermissions>> | undefined>
    public async getCommandPerms(guildId: string, commandName: string, skipCache?: boolean): Promise<CommandPermissions | undefined>
    public async getCommandPerms(...args: [string, boolean?] | [string, string, boolean?]): Promise<CommandPermissions | Readonly<Record<string, CommandPermissions>> | undefined> {
        const [guildId, commandName, skipCache] = args.length === 1
            ? [args[0], undefined, undefined]
            : args.length === 3 ? args
                : typeof args[1] === 'boolean'
                    ? [args[0], undefined, args[1]]
                    : [args[0], args[1], undefined];

        const guild = await this.#table.get(guildId, skipCache);

        if (commandName !== undefined)
            return guild?.commandperms?.[commandName];
        return guild?.commandperms;
    }

    public async setCommandPerms(guildId: string, commands: string[], permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return [];

        const payload = commands.reduce<Record<string, CommandPermissions>>((p, c) => {
            p[c] = this.#table.updateExpr(<CommandPermissions>permissions);
            return p;
        }, {});
        if (commands.length === 0 || !await this.#table.update(guildId, { commandperms: payload }))
            return [];

        const perms = setIfUndefined(guild, 'commandperms', {});
        for (const command of commands) {
            const commandPerms = setIfUndefined(perms, command, {});
            Object.assign(commandPerms, permissions);
        }

        return Object.keys(payload);
    }

    public async getCustomCommands(guildId: string, skipCache = false): Promise<readonly NamedGuildCommandTag[]> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild?.ccommands === undefined)
            return [];

        return Object.entries(guild.ccommands)
            .filter((v): v is [string, GuildCommandTag] => guard.hasValue(v[1]))
            .map(v => ({ ...v[1], name: v[0] }));
    }

    public async getCustomCommandNames(guildId: string, skipCache?: boolean): Promise<readonly string[]> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild?.ccommands === undefined)
            return [];
        return Object.keys(guild.ccommands);
    }

    public async get(guildId: string, skipCache = false): Promise<StoredGuild | undefined> {
        return await this.#table.get(guildId, skipCache);
    }

    public async upsert(guild: GuildDetails): Promise<'inserted' | 'updated' | false> {
        const current = await this.#table.get(guild.id, true);
        if (current === undefined) {
            if (await this.#table.insert({
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
            const update: Mutable<Partial<StoredGuild>> = {};
            if (!current.active)
                update.active = true;
            if (current.name !== guild.name)
                update.name = guild.name;

            if (Object.values(update).some(guard.hasValue) && await this.#table.update(guild.id, update))
                return 'updated';
        }

        return false;
    }

    public async exists(guildId: string, skipCache = false): Promise<boolean> {
        return await this.#table.get(guildId, skipCache) !== undefined;
    }

    public async isActive(guildId: string, skipCache = false): Promise<boolean> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.active ?? false;
    }

    public async setActive(guildId: string, active = true): Promise<boolean> {
        return await this.#table.update(guildId, this.#table.updateExpr({ active }));
    }

    public async getIds(): Promise<string[]> {
        return await this.#table.queryAll(t => t.getField('guildid'));
    }

    public async getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache = false): Promise<StoredGuildSettings[K] | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        return guild?.settings[key];
    }

    public async setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, { settings: { [key]: this.#table.setExpr(value) } }))
            return false;

        setProp(guild.settings, key, value);
        return true;
    }

    public async getCommand(guildId: string, commandName: string, skipCache = false): Promise<NamedGuildCommandTag | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        commandName = commandName.toLowerCase();
        const command = guild?.ccommands[commandName];
        return command === undefined ? undefined : { ...command, name: commandName };
    }

    public async getIntervals(): Promise<ReadonlyArray<{ readonly guildId: string; readonly interval: GuildTriggerTag; }>> {
        const guilds = await this.#table.queryAll(t => t.getAll(true, { index: 'interval' }).filter(g => g('active').eq(true)).pluck('guildid', 'interval'));
        return guilds.map(g => g.interval === undefined ? undefined : { guildId: g.guildid, interval: g.interval })
            .filter(guard.hasValue);
    }

    public async updateCommand(guildId: string, commandName: string, partialCommand: Partial<GuildCommandTag>): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        commandName = commandName.toLowerCase();
        const command = guild.ccommands[commandName];
        if (command === undefined || !await this.#table.update(guildId, { ccommands: { [commandName]: this.#table.updateExpr(partialCommand) } }))
            return false;

        Object.assign(command, partialCommand);
        return true;
    }

    public async updateCommands(guildId: string, commandNames: string[], partialCommand: Partial<GuildCommandTag>): Promise<readonly string[]> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return [];

        const commands = commandNames.map(c => [c, guild.ccommands[c.toLowerCase()]] as const);
        const payload = commands.reduce<UpdateData<Record<string, GuildCommandTag>>>((p, c) => {
            if (c[1] !== undefined)
                p[c[0]] = this.#table.updateExpr(partialCommand);
            return p;
        }, {});

        if (Object.keys(payload).length === 0 || !await this.#table.update(guildId, { ccommands: payload }))
            return [];

        for (const [, command] of commands)
            if (command !== undefined)
                Object.assign(command, partialCommand);

        return Object.keys(payload);
    }

    public async setCommandProp<K extends keyof GuildCommandTag>(guildId: string, commandName: string, key: K, value: GuildCommandTag[K]): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        commandName = commandName.toLowerCase();

        const command = guild.ccommands[commandName];
        if (command === undefined || !await this.#table.update(guildId, { ccommands: { [commandName]: { [key]: this.#table.setExpr(value) } } }))
            return false;

        if (value === undefined)
            delete command[key];
        else
            command[key] = value;
        return true;
    }

    public async setCommand(guildId: string, commandName: string, command: GuildCommandTag | undefined): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        commandName = commandName.toLowerCase();
        if (!await this.#table.update(guildId, { ccommands: { [commandName]: this.#table.setExpr(command) } }))
            return false;

        setProp(guild.ccommands, commandName, command);
        return true;
    }

    public async renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        oldName = oldName.toLowerCase();
        newName = newName.toLowerCase();
        if (guild.ccommands[oldName] === undefined
            || guild.ccommands[newName] !== undefined
            || !await this.#table.update(guildId, r => ({ ccommands: { [newName]: r('ccommands')(oldName), [oldName]: this.#table.setExpr(undefined) } })))
            return false;

        setProp(guild.ccommands, newName, guild.ccommands[oldName]);
        setProp(guild.ccommands, oldName, undefined);
        return true;
    }

    public async getNewModlogCaseId(guildId: string, skipCache?: boolean): Promise<number | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild === undefined)
            return undefined;

        await this.#table.update(guildId, g => ({
            nextModlogId: g('nextModlogId').default(
                g('modlog').default([]).max('caseid').default(0)
            ).add(1)
        }));

        return guild.nextModlogId;
    }

    public async getModlogCase(guildId: string, caseId?: number, skipCache?: boolean): Promise<GuildModlogEntry | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild === undefined)
            return undefined;

        if (caseId === undefined)
            return guild.modlog?.[guild.modlog.length - 1];
        return guild.modlog?.find(m => m.caseid === caseId);
    }

    public async updateModlogCase(guildId: string, caseid: number, modlog: Partial<Omit<GuildModlogEntry, 'caseid'>>): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        const updated = await this.#table.update(guildId, g => ({
            modlog: g('modlog').default([]).map(m => this.#table.branchExpr(m,
                c => c('caseid').eq(caseid),
                c => c.merge(modlog)
            ))
        }));

        if (!updated)
            return false;

        const entry = guild.modlog?.find(m => m.caseid === caseid);
        if (entry !== undefined)
            Object.assign(entry, modlog);

        return true;
    }

    public async removeModlogCases(guildId: string, ids?: number[]): Promise<readonly GuildModlogEntry[] | undefined> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return undefined;

        const result = ids === undefined
            ? [...guild.modlog ?? []]
            : guild.modlog?.filter(m => ids.includes(m.caseid)) ?? [];

        const removed = ids === undefined
            ? await this.#table.update(guildId, { modlog: this.#table.setExpr(undefined) })
            : await this.#table.update(guildId, g => ({
                modlog: g('modlog').default([]).filter(c => this.#table.expr(ids).contains(c('caseid')))
            }));

        if (!removed)
            return undefined;

        setProp(guild, 'modlog', guild.modlog?.filter(m => ids?.includes(m.caseid) ?? false));
        return result;
    }

    public async addModlogCase(guildId: string, modlog: GuildModlogEntry): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, r => ({ modlog: r('modlog').default([]).append(this.#table.addExpr(modlog)) })))
            return false;

        const modlogs = setIfUndefined(guild, 'modlog', []);
        push(modlogs, modlog);
        return true;
    }

    public async setLogIgnores(guildId: string, userIds: string[]): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, r => ({ logIgnore: r('logIgnore').default([]).setUnion(userIds) })))
            return false;

        setProp(guild, 'logIgnore', [...new Set([...guild.logIgnore ?? [], ...userIds])]);
        return true;
    }

    public async setLogChannel(guildId: string, events: StoredGuildEventLogType | StoredGuildEventLogType[], channel: string | undefined): Promise<boolean> {
        if (typeof events === 'string')
            events = [events];

        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        const logUpdate = events.reduce<{ [key: string]: string | undefined; }>((p, c) => {
            p[c] = channel;
            return p;
        }, {});

        if (!await this.#table.update(guildId, { log: this.#table.updateExpr(logUpdate) }))
            return false;

        const log = setIfUndefined(guild, 'log', {});
        for (const event of events)
            setProp(log, event, channel);
        return true;
    }

    public async getWarnings(guildId: string, userId: string, skipCache?: boolean): Promise<number | undefined> {
        const guild = await this.#table.get(guildId, skipCache);
        if (guild === undefined)
            return undefined;

        return guild.warnings?.users?.[userId];
    }

    public async setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean> {
        const guild = await this.#table.get(guildId);
        if (guild === undefined)
            return false;

        if (!await this.#table.update(guildId, { warnings: { users: { [userId]: this.#table.setExpr(count) } } }))
            return false;

        const warnings = setIfUndefined(guild, 'warnings', {});
        const users = setIfUndefined(warnings, 'users', {});
        setProp(users, userId, count);
        return true;
    }

    public async migrate(): Promise<void> {
        const indexes = await this.#table.query(t => t.indexList());
        if (!indexes.includes('interval')) {
            await this.#table.query(t => t.indexCreate('interval', r => r('ccommands').hasFields('_interval')));
        }
    }
}

function setProp<Target, Key extends keyof Target>(target: Target, key: Key, value: Target[Key]): Target[Key] {
    if (value as unknown === undefined)
        delete target[key];
    else
        target[key] = value;
    return value;
}

function setIfUndefined<Target, Key extends keyof Target>(target: Target, key: Key, value: Exclude<Target[Key], undefined>): Exclude<Target[Key], undefined> {
    return (target[key] ??= value) as Exclude<Target[Key], undefined>;
}

function push<T>(target: readonly T[], ...values: readonly T[]): void {
    (target as T[]).push(...values);
}

type IsTrueRecord<T> = T extends Record<infer Key, unknown>
    ? string extends Key ? true
    : number extends Key ? true
    : symbol extends Key ? true
    : false : false;

type OptionalProperties<T> = IsTrueRecord<T> extends true ? keyof T :
    Exclude<keyof T, { [P in keyof T]-?: Pick<T, P> extends { [K in P]-?: T[P] } ? IsTrueRecord<Pick<T, P>> extends true ? P : never : never }[keyof T]>;
