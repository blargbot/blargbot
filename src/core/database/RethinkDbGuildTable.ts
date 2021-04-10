import { GuildModlogEntry, StoredGuildSettings, StoredGuild, StoredGuildCommand, NamedStoredGuildCommand, CommandPermissions } from './types';
import { GuildTable } from './types';
import { RethinkDbCachedTable } from './core/RethinkDbCachedTable';
import { RethinkDb } from './core/RethinkDb';
import { UpdateRequest } from './core/RethinkDbTable';
import { guard } from '../../utils';

export class RethinkDbGuildTable extends RethinkDbCachedTable<'guild', 'guildid'> implements GuildTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('guild', 'guildid', rethinkDb, logger);
    }

    public async getCommandPerms(guildId: string, commandName: string, skipCache = false): Promise<DeepReadOnly<CommandPermissions> | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.commandperms?.[commandName];
    }

    public async listCommands(guildId: string, skipCache = false): Promise<DeepReadOnly<NamedStoredGuildCommand[]>> {
        const guild = await this.rget(guildId, skipCache);
        if (!(guild?.ccommands))
            return [];

        return Object.entries(guild.ccommands)
            .filter((v): v is [string, StoredGuildCommand] => guard.hasValue(v[1]))
            .map(v => ({ ...v[1], name: v[0] }));
    }

    public async get(guildId: string, skipCache = false): Promise<DeepReadOnly<StoredGuild> | undefined> {
        return await this.rget(guildId, skipCache);
    }

    public async add(guild: StoredGuild): Promise<boolean> {
        return await this.rinsert(guild);
    }

    public async getIds(): Promise<string[]> {
        return await this.rqueryAll(t => t.getField('guildid'));
    }

    public async getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache = false): Promise<DeepReadOnly<StoredGuildSettings>[K] | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.settings[key];
    }

    public async setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        if (value === undefined)
            delete guild.settings[key];

        else
            guild.settings[key] = value;

        return await this.rupdate(guildId, r => ({
            settings: {
                [key]: r.literal(...(value !== undefined ? [value] : []))
            }
        }));
    }

    public async getCommand(guildId: string, commandName: string, skipCache = false): Promise<DeepReadOnly<StoredGuildCommand> | undefined> {
        const guild = await this.rget(guildId, skipCache);
        return guild?.ccommands[commandName.toLowerCase()];
    }

    public async withIntervalCommand(): Promise<DeepReadOnly<StoredGuild[]> | undefined> {
        return await this.rqueryAll(t => t.getAll('interval'));
    }

    public async updateCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        commandName = commandName.toLowerCase();
        if (!guild.ccommands[commandName])
            return false;

        return await this.rupdate(guildId, {
            ccommands: {
                [commandName]: command
            }
        });
    }

    public async setCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        commandName = commandName.toLowerCase();
        if (command === undefined)
            delete guild.ccommands[commandName];

        else
            guild.ccommands[commandName] = command;

        return await this.rupdate(guildId, r => ({
            ccommands: {
                [commandName]: r.literal(...(command !== undefined ? [command] : []))
            }
        }));
    }

    public async renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        oldName = oldName.toLowerCase();
        newName = newName.toLowerCase();
        if (!guild.ccommands[oldName])
            return false;

        guild.ccommands[newName] = guild.ccommands[oldName];
        delete guild.ccommands[oldName];
        return await this.rupdate(guildId, r => ({
            ccommands: {
                [oldName]: r.literal(),
                [newName]: r.literal(guild.ccommands[newName])
            }
        }));
    }

    public async addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        guild.modlog ??= [];
        guild.modlog.push(modlog);

        return await this.rupdate(guildId, r => ({
            modlog: r.literal(guild.modlog)
        }));
    }

    public async setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        guild.log ??= {};
        if (channel === undefined)
            delete guild.log[event];

        else
            guild.log[event] = channel;

        return await this.rupdate(guildId, r => ({
            log: <UpdateRequest<Record<string, string>>>{
                [event]: r.literal(...(channel !== undefined ? [channel] : []))
            }
        }));
    }

    public async setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean> {
        const guild = await this.rget(guildId);
        if (!guild)
            return false;

        const warnings = guild.warnings ??= {};
        const users = warnings.users ??= {};
        users[userId] = count;
        return await this.rupdate(guildId, r => ({
            warnings: {
                users: {
                    [userId]: r.literal(...(count !== undefined ? [count] : []))
                }
            }
        }));
    }

    public async migrate(): Promise<void> {
        const indexes = await this.rquery(t => t.indexList());
        if (!indexes.includes('interval')) {
            await this.rquery((t, r) => t.indexCreate('interval', r.row('ccommands').hasFields('_interval')));
        }
    }
}
