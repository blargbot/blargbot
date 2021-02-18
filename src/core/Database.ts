import { GetStoredVar, GuildModlogEntry, GuildSettings, KnownStoredVars, Query, RethinkDb, RethinkDbOptions, StoredEvent, StoredGuild, StoredGuildCommand, StoredTag, StoredUser } from './RethinkDb';
import { WriteChange } from 'rethinkdb';
import { Client as ErisClient, User } from 'eris';
import { sleep } from '../utils';
import { Expression } from 'rethinkdb';

type r = Parameters<Query<unknown>>[0];

type UpdateRequest<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [P in keyof T]?: T[P] | Expression<T[P]> | UpdateRequest<T[P]>
}

type RethinkTableMap = {
    'guild': StoredGuild;
    'tag': StoredTag;
    'user': StoredUser;
    'vars': KnownStoredVars;
    'events': Omit<StoredEvent, 'id'>
}

interface DatabaseOptions {
    logger: CatLogger,
    discord: ErisClient,
    rethinkDb: RethinkDbOptions
}

export class Database {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #r: RethinkDb;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guildCache: Record<string, StoredGuild | undefined>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #userCache: Record<string, StoredUser | undefined>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #logger: CatLogger;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #discord: ErisClient;

    public constructor(options: DatabaseOptions) {
        this.#r = new RethinkDb(options.rethinkDb);
        this.#discord = options.discord;
        this.#guildCache = {};
        this.#userCache = {};
        this.#logger = options.logger;
    }

    public async connect(): Promise<void> {
        this.connect = () => Promise.resolve();
        await this.#r.connect()
            .then(() => {
                this.#logger.init('rethinkdb connected');
                void this._rethinkChangeFeed('guild', 'guildid', this.#guildCache, id => !!this.#discord.guilds.get(id));
                void this._rethinkChangeFeed('user', 'userid', this.#userCache, id => !!this.#discord.users.get(id));
                void this._registerIndexes();
            });
    }

    public async getVariable<K extends KnownStoredVars['varname']>(key: K): Promise<DeepReadOnly<GetStoredVar<K>> | undefined> {
        return <GetStoredVar<K> | undefined>await this._rethinkGet('vars', key);
    }
    public async setVariable<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean> {
        return await this._rethinkUpdate('vars', value.varname, r => <UpdateRequest<GetStoredVar<K>>>r.literal(value))
            || await this._rethinkInsert('vars', value);
    }
    public async deleteVariable<K extends KnownStoredVars['varname']>(key: K): Promise<boolean> {
        return await this._rethinkDelete('vars', key);
    }

    public async getUser(userId: string, skipCache = false): Promise<DeepReadOnly<StoredUser> | undefined> {
        return this._getUser(userId, skipCache);
    }

    private async _getUser(userId: string, skipCache = false): Promise<StoredUser | undefined> {
        return await this._rethinkGetCachable('user', userId, skipCache, this.#userCache);
    }

    public async addUser(user: StoredUser): Promise<boolean> {
        return this._rethinkInsert('user', user);
    }

    public async upsertUser(user: User): Promise<boolean> {
        if (user.discriminator === '0000') return false;
        const currentUser = await this._getUser(user.id);
        if (currentUser === undefined) {
            this.#logger.debug(`inserting user ${user.id} (${user.username})`);
            return await this.addUser({
                userid: user.id,
                username: user.username,
                usernames: [{
                    name: user.username,
                    date: new Date()
                }],
                isbot: user.bot,
                lastspoke: new Date(),
                discriminator: user.discriminator,
                todo: []
            });
        } else {
            const update: Partial<StoredUser> = {};
            if (currentUser.username != user.username) {
                update.username = user.username;
                update.usernames = currentUser.usernames;
                update.usernames.push({
                    name: user.username,
                    date: new Date()
                });
            }
            if (currentUser.discriminator != user.discriminator) {
                update.discriminator = user.discriminator;
            }
            if (currentUser.avatarURL != user.avatarURL) {
                update.avatarURL = user.avatarURL;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ in update)
                return await this._rethinkUpdate('user', user.id, update);
        }
        return false;
    }

    public async getTag(tagName: string): Promise<DeepReadOnly<StoredTag> | undefined> {
        return await this._rethinkGet('tag', tagName);
    }

    public async incrementTagUses(tagName: string, count = 1): Promise<boolean> {
        return await this._rethinkUpdate('tag', tagName, r => ({
            uses: r.row<number>('uses').default(0).add(count),
            lastuse: new Date()
        }));
    }

    public async getGuild(guildId: string, skipCache = false): Promise<DeepReadOnly<StoredGuild> | undefined> {
        return await this._getGuild(guildId, skipCache);
    }

    public async addGuild(guild: StoredGuild): Promise<boolean> {
        return await this._rethinkInsert('guild', guild);
    }

    public async getGuildIds(): Promise<string[]> {
        return await this.#r.queryAll(r => r.table('guild').getField('guildid'));
    }

    private async _getGuild(guildId: string, skipCache = false): Promise<StoredGuild | undefined> {
        return await this._rethinkGetCachable('guild', guildId, skipCache, this.#guildCache);
    }

    public async getGuildSetting<K extends keyof GuildSettings>(guildId: string, key: K, skipCache = false): Promise<DeepReadOnly<GuildSettings>[K] | undefined> {
        const guild = await this.getGuild(guildId, skipCache);
        return guild?.settings[key];
    }

    public async setGuildSetting<K extends keyof GuildSettings>(guildId: string, key: K, value: GuildSettings[K]): Promise<boolean> {
        const guild = await this._getGuild(guildId);
        if (!guild)
            return false;

        if (value === undefined)
            delete guild.settings[key];
        else
            guild.settings[key] = value;

        return await this._rethinkUpdate('guild', guildId, r => ({
            settings: {
                [key]: r.literal(value)
            }
        }));
    }

    public async getGuildCommand(guildId: string, commandName: string, skipCache = false): Promise<DeepReadOnly<StoredGuildCommand> | undefined> {
        const guild = await this.getGuild(guildId, skipCache);
        return guild?.ccommands[commandName.toLowerCase()];
    }

    public async getIntervalGuilds(): Promise<DeepReadOnly<StoredGuild[]> | undefined> {
        return this.#r.queryAll(r => r.table('guild').getAll('interval'));
    }

    public async updateGuildCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean> {
        const guild = await this.getGuild(guildId);
        if (!guild)
            return false;

        commandName = commandName.toLowerCase();
        if (!guild.ccommands[commandName])
            return false;

        return await this._rethinkUpdate('guild', guildId, {
            ccommands: {
                [commandName]: command
            }
        });
    }

    public async setGuildCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean> {
        const guild = await this._getGuild(guildId);
        if (!guild)
            return false;

        commandName = commandName.toLowerCase();
        if (command === undefined)
            delete guild.ccommands[commandName];
        else
            guild.ccommands[commandName] = command;

        return await this._rethinkUpdate('guild', guildId, r => ({
            ccommands: {
                [commandName]: r.literal(command)
            }
        }));
    }

    public async renameGuildCommand(guildId: string, oldName: string, newName: string): Promise<boolean> {
        const guild = await this._getGuild(guildId);
        if (!guild)
            return false;

        oldName = oldName.toLowerCase();
        newName = newName.toLowerCase();
        if (!guild.ccommands[oldName])
            return false;

        guild.ccommands[newName] = guild.ccommands[oldName];
        delete guild.ccommands[oldName];
        return await this._rethinkUpdate('guild', guildId, r => ({
            ccommands: {
                [oldName]: r.literal(undefined),
                [newName]: r.literal(guild.ccommands[newName])
            }
        }));
    }

    public async addGuildModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean> {
        const guild = await this._getGuild(guildId);
        if (!guild)
            return false;

        guild.modlog ??= [];
        guild.modlog.push(modlog);

        return await this._rethinkUpdate('guild', guildId, r => ({
            modlog: r.literal(guild.modlog)
        }));
    }

    public async setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean> {
        const guild = await this._getGuild(guildId);
        if (!guild)
            return false;

        guild.log ??= {};
        if (channel === undefined)
            delete guild.log[event];
        else
            guild.log[event] = channel;

        return await this._rethinkUpdate('guild', guildId, r => ({
            log: <UpdateRequest<Record<string, string>>>{
                [event]: r.literal(channel)
            }
        }));
    }

    public async setGuildWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean> {
        const guild = await this._getGuild(guildId);
        if (!guild)
            return false;

        const warnings = guild.warnings ??= {};
        const users = warnings.users ??= {};
        users[userId] = count;
        return await this._rethinkUpdate('guild', guildId, r => ({
            warnings: {
                users: {
                    [userId]: r.literal(count)
                }
            }
        }));
    }

    public async addEvent(event: Omit<StoredEvent, 'id'>): Promise<boolean> {
        return await this._rethinkInsert('events', event, true);
    }

    public async removeEvent(eventId: string): Promise<boolean> {
        return await this._rethinkDelete('events', eventId);
    }

    public async removeEvents(filter: Partial<StoredEvent>): Promise<boolean> {
        return await this._rethinkDelete('events', filter);
    }

    public async getEvents({ before, after = new Date(0) }: { before: Date, after?: Date }): Promise<StoredEvent[]> {
        return await this.#r.queryAll(r => r.table('events').between(after, before, { index: 'endtime' }));
    }

    private async _rethinkGetCachable<K extends keyof RethinkTableMap>(
        table: K,
        key: string,
        skipCache: boolean,
        cache: Record<string, RethinkTableMap[K] | undefined>
    ): Promise<RethinkTableMap[K] | undefined> {
        const result = skipCache ? undefined : cache[key];
        if (result !== undefined)
            return result;
        return cache[key] = await this._rethinkGet(table, key);
    }

    private async _rethinkGet<K extends keyof RethinkTableMap>(
        table: K,
        key: string
    ): Promise<RethinkTableMap[K] | undefined> {
        return await this.#r.query(r => r.table(table).get<RethinkTableMap[K]>(key)) ?? undefined;
    }

    private async _rethinkInsert<K extends keyof RethinkTableMap>(table: K, value: RethinkTableMap[K], applyChanges = false): Promise<boolean> {
        const result = await this.#r.query(r => r.table(table).insert(value, { returnChanges: applyChanges }));
        if (applyChanges && result.changes?.[0]?.new_val)
            Object.apply(value, result.changes?.[0].new_val);
        return result.inserted + result.unchanged > 0;
    }

    private async _rethinkUpdate<K extends keyof RethinkTableMap>(
        table: K,
        key: string,
        value: UpdateRequest<RethinkTableMap[K]> | ((r: r) => UpdateRequest<RethinkTableMap[K]>)
    ): Promise<boolean> {
        const getter = typeof value === 'function' ? value : () => value;
        const result = await this.#r.query(r => r.table(table).get(key).update(getter(r)));
        return result.replaced + result.unchanged > 0;
    }

    private async _rethinkDelete<K extends keyof RethinkTableMap>(
        table: K,
        key: string | Partial<RethinkTableMap[K]>
    ): Promise<boolean> {
        const result = typeof key === 'string'
            ? await this.#r.query(r => r.table(table).get(key).delete())
            : await this.#r.query(r => r.table(table).delete(key));
        return result.deleted > 0;
    }

    private async _registerIndexes(): Promise<void> {
        const indexes = await this.#r.query(r => r.table('guild').indexList());
        if (!indexes.includes('interval')) {
            await this.#r.query(r => r.table('guild').indexCreate('interval', r.row('ccommands').hasFields('_interval')));
        }
    }

    private async _rethinkChangeFeed<T, K extends keyof T>(
        table: string,
        idName: K,
        cache: Record<string, T | undefined>,
        exists: (id: T[K]) => boolean = () => true
    ): Promise<void> {
        this.#logger.info(`Registering a ${table} changefeed!`);
        while (true) {
            try {
                const changefeed = this.#r.stream<WriteChange>(r => r.table(table).changes({ squash: true }));
                for await (const data of changefeed) {
                    if (!data.new_val)
                        delete cache[data.old_val[idName]];
                    else {
                        const id = data.new_val[idName];
                        if (cache[id] !== undefined && !exists(id))
                            cache[id] = data.new_val;
                    }
                }
            }
            catch (err) {
                this.#logger.warn(`Error from changefeed for table '${table}', will try again in 10 seconds.`, err);
                await sleep(10000);
            }
        }
    }
}