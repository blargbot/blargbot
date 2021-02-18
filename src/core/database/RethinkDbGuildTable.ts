import { GuildModlogEntry, GuildSettings, StoredGuild, StoredGuildCommand } from './types';
import { UpdateRequest, GuildTable } from './types';
import { RethinkDbCachedTable } from './core/RethinkDbCachedTable';
import { RethinkDb } from './core/RethinkDb';

export class RethinkDbGuildTable extends RethinkDbCachedTable<'guild', 'guildid'> implements GuildTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('guild', 'guildid', rethinkDb, logger);
    }


    public async get(guildId: string, skipCache = false): Promise<DeepReadOnly<StoredGuild> | undefined> {
        return await this._get(guildId, skipCache);
    }

    public async add(guild: StoredGuild): Promise<boolean> {
        return await this.rinsert(guild);
    }

    public async getIds(): Promise<string[]> {
        return await this.rethinkDb.queryAll(r => r.table(this.table).getField('guildid'));
    }

    private async _get(guildId: string, skipCache = false): Promise<StoredGuild | undefined> {
        return await this.rgetCached(guildId, skipCache);
    }

    public async getSetting<K extends keyof GuildSettings>(guildId: string, key: K, skipCache = false): Promise<DeepReadOnly<GuildSettings>[K] | undefined> {
        const guild = await this.get(guildId, skipCache);
        return guild?.settings[key];
    }

    public async setSetting<K extends keyof GuildSettings>(guildId: string, key: K, value: GuildSettings[K]): Promise<boolean> {
        const guild = await this._get(guildId);
        if (!guild)
            return false;

        if (value === undefined)
            delete guild.settings[key];

        else
            guild.settings[key] = value;

        return await this.rupdate(guildId, r => ({
            settings: {
                [key]: r.literal(value)
            }
        }));
    }

    public async getCommand(guildId: string, commandName: string, skipCache = false): Promise<DeepReadOnly<StoredGuildCommand> | undefined> {
        const guild = await this.get(guildId, skipCache);
        return guild?.ccommands[commandName.toLowerCase()];
    }

    public async withIntervalCommand(): Promise<DeepReadOnly<StoredGuild[]> | undefined> {
        return await this.rethinkDb.queryAll(r => r.table(this.table).getAll('interval'));
    }

    public async updateCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean> {
        const guild = await this.get(guildId);
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
        const guild = await this._get(guildId);
        if (!guild)
            return false;

        commandName = commandName.toLowerCase();
        if (command === undefined)
            delete guild.ccommands[commandName];

        else
            guild.ccommands[commandName] = command;

        return await this.rupdate(guildId, r => ({
            ccommands: {
                [commandName]: r.literal(command)
            }
        }));
    }

    public async renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean> {
        const guild = await this._get(guildId);
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
                [oldName]: r.literal(undefined),
                [newName]: r.literal(guild.ccommands[newName])
            }
        }));
    }

    public async addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean> {
        const guild = await this._get(guildId);
        if (!guild)
            return false;

        guild.modlog ??= [];
        guild.modlog.push(modlog);

        return await this.rupdate(guildId, r => ({
            modlog: r.literal(guild.modlog)
        }));
    }

    public async setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean> {
        const guild = await this._get(guildId);
        if (!guild)
            return false;

        guild.log ??= {};
        if (channel === undefined)
            delete guild.log[event];

        else
            guild.log[event] = channel;

        return await this.rupdate(guildId, r => ({
            log: <UpdateRequest<Record<string, string>>>{
                [event]: r.literal(channel)
            }
        }));
    }

    public async setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean> {
        const guild = await this._get(guildId);
        if (!guild)
            return false;

        const warnings = guild.warnings ??= {};
        const users = warnings.users ??= {};
        users[userId] = count;
        return await this.rupdate(guildId, r => ({
            warnings: {
                users: {
                    [userId]: r.literal(count)
                }
            }
        }));
    }

    public async migrate(): Promise<void> {
        const indexes = await this.rethinkDb.query(r => r.table(this.table).indexList());
        if (!indexes.includes('interval')) {
            await this.rethinkDb.query(r => r.table(this.table).indexCreate('interval', r.row('ccommands').hasFields('_interval')));
        }
    }
}
