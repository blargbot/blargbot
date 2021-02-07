import * as r from 'rethinkdb';
import { FlagDefinition } from '../newbu';

export interface StoredVar<T extends string> {
    varname: T;
}

export interface RestartStoredVar extends StoredVar<'restart'> {
    varvalue: {
        channel: string;
        time: number;
    };
}
export interface TagVarsStoredVar extends StoredVar<'tagVars'> {
    values: Record<string, unknown> | null;
}
export interface ARWhitelistStoredVar extends StoredVar<'arwhitelist'> {
    values: string[];
}
export interface GuildBlacklistStoredVar extends StoredVar<'guildBlacklist'> {
    values: { [guildid: string]: boolean | undefined };
}
export interface BlacklistStoredVar extends StoredVar<'blacklist'> {
    users: string[];
    guilds: string[];
}
export interface WhitelistedDomainsStoredVar extends StoredVar<'whitelistedDomains'> {
    values: { [domain: string]: boolean };
}
export interface ChangelogStoredVar extends StoredVar<'changelog'> {
    guilds: { [guildid: string]: string };
}
export interface PGStoredVar extends StoredVar<'pg'> {
    value: number;
}
export interface PoliceStoredVar extends StoredVar<'police'> {
    value: string[];
}
export interface SupportStoredVar extends StoredVar<'support'> {
    value: string[];
}
export interface CleverStatsStoredVar extends StoredVar<'cleverstats'> {
    stats: { [date: string]: { uses: number } };
}
export interface VersionStoredVar extends StoredVar<'version'> {
    major: number;
    minor: number;
    patch: number;
}
export type KnownStoredVars =
    | RestartStoredVar
    | TagVarsStoredVar
    | ARWhitelistStoredVar
    | GuildBlacklistStoredVar
    | BlacklistStoredVar
    | WhitelistedDomainsStoredVar
    | ChangelogStoredVar
    | PGStoredVar
    | PoliceStoredVar
    | SupportStoredVar
    | VersionStoredVar
    | CleverStatsStoredVar

export type GetStoredVar<T extends KnownStoredVars['varname']> = Extract<KnownStoredVars, { varname: T }>;

export interface StoredEvent {
    id: string;
    type: string;
    endtime: number;
    channel?: string;
    guild?: string;
    user?: string;
}

export interface StoredGuild {
    guildid: string;
    active: boolean;
    name: string;
    settings?: GuildSettings;
    channels?: { [channelId: string]: ChannelSettings | undefined };
    ccommands?: { [key: string]: StoredGuildCommand | undefined };
    commandperms?: { [key: string]: CommandPermissions | undefined };
    censor?: GuildCensors;
    warnings?: GuildWarnings;
    modlog?: GuildModlogEntry[];
    roleme?: GuildRolemeEntry[];
    autoresponse?: GuildAutoresponses;
}

export interface GuildAutoresponses {
    everything?: GuildAutoresponse;
    list?: GuildFilteredAutoresponse[];
}

export interface GuildAutoresponse {
    executes: string;
}

export interface GuildFilteredAutoresponse extends GuildAutoresponse {
    regex: boolean;
    term: string;
}

export interface GuildRolemeEntry {
    channels: string[];
    casesensitive: boolean;
    message: string;
    add?: string[];
    remove?: string[];
    output?: string;
}

export interface GuildWarnings {
    users?: { [userId: string]: number | undefined };
}

export interface GuildCensors {
    list?: GuildCensor[]
    exception?: GuildCensorExceptions;
    rule?: GuildCensorRule;
}

export interface GuildCensorRule {
    deleteMessage?: string;
    banMessage?: string;
    kickMessage?: string;
}

export interface GuildCensor extends GuildCensorRule {
    term: string;
    regex: boolean;
    weight: number;
    reason?: string;
}

export interface GuildCensorExceptions {
    channel?: string | string[];
    user?: string | string[];
    role?: string | string[];
}

export interface StoredGuildCommand {
    help?: string;
    lang?: string;
    alias?: string;
    authorizer?: string;
    content: string;
    author?: string;
    hidden?: boolean;
    roles?: string[];
    uses?: number;
    flags?: FlagDefinition[];
    cooldown?: number;
}

export interface CommandPermissions {
    disabled?: boolean;
    permission?: number;
    rolename?: string;
}

export interface StoredTag {
    content: string;
    author?: string;
    uses?: number;
    flags?: FlagDefinition[]
    cooldown?: number;
}

export interface GuildSettings {
    permoverride?: boolean;
    staffperms?: number | string;
    social?: boolean;
    makelogs?: boolean;
    prefix?: string[] | string;
    nocleverbot?: boolean;
    tableflip?: boolean;
    disablenoperms?: boolean;
    adminrole?: string;
    antimention?: string;
    banat?: number;
    kickat?: number;
    modlog?: string;
    deletenotif?: string;
}

export interface GuildModlogEntry {
    caseid?: number;
    modid?: string;
    msgid?: string;
    reason?: string;
    type?: string;
    userid?: string;
}

export interface ChannelSettings {
    blacklisted?: boolean;
}

export interface StoredUsername {
    name: string,
    date: r.Expression<r.Time>
}

export interface StoredUser {
    dontdmerrors?: boolean;
    prefixes?: string[];
    username?: string;
    usernames?: StoredUsername[];
    discriminator?: string;
    avatarURL?: string;
    blacklisted?: boolean;
}

export interface RethinkDbOptions {
    database: string;
    user: string;
    password: string;
    host: string;
    port: number;
}

export type Query<T, R = r.Operation<T>> = (rethink: typeof r) => r.Operation<T> | R;

export class RethinkDb {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #connectionPromise?: Promise<r.Connection>
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #connection?: r.Connection
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #options: RethinkDbOptions;

    public constructor(options: RethinkDbOptions) {
        this.#options = options;
    }

    public async getGuild(guildId: string): Promise<StoredGuild | null> {
        return await this.query(r => r.table('guild').get<StoredGuild>(guildId));
    }

    public async setGuild(guild: StoredGuild): Promise<r.WriteResult> {
        return await this.query(r => r.table('guild').replace(guild));
    }

    public async getUser(userId: string): Promise<StoredUser | null> {
        return await this.query(r => r.table('user').get<StoredUser>(userId));
    }

    public async setUser(user: StoredUser): Promise<r.WriteResult> {
        return await this.query(r => r.table('user').replace(user));
    }

    public async getTag(tagName: string): Promise<StoredTag | null> {
        return await this.query(r => r.table('tag').get<StoredTag>(tagName));
    }

    public async setTag(tag: StoredTag): Promise<r.WriteResult> {
        return await this.query(r => r.table('tag').replace(tag));
    }

    public async deleteVar<T extends KnownStoredVars['varname']>(varname: T): Promise<r.WriteResult> {
        return await this.query(r => r.table('vars').get(varname).delete());
    }

    public async getVar<T extends KnownStoredVars['varname']>(varname: T): Promise<GetStoredVar<T> | null> {
        return await this.query(r => r.table('vars').get<GetStoredVar<T>>(varname));
    }

    public async setVar<T extends KnownStoredVars['varname']>(value: GetStoredVar<T>): Promise<r.WriteResult> {
        const repl = await this.query(r => r.table('vars').replace(value));
        if (repl.replaced === 1 || repl.inserted === 1)
            return repl;

        return await this.query(r => r.table('vars').insert(value));
    }

    public async query<T>(query: Query<T>): Promise<T>
    public async query<T>(query: Query<T | undefined>): Promise<T | undefined>
    public async query<T>(query: Query<T | undefined>): Promise<T | undefined> {
        const connection = this.#connection ?? await this.connect();
        return await query(r)?.run(connection);
    }

    public async queryAll<T>(query: Query<r.Cursor>): Promise<T[]> {
        const stream = this.stream<T>(query);
        const result = [];
        for await (const item of stream)
            result.push(item);
        return result;
    }

    public async * stream<T>(query: Query<r.Cursor>): AsyncIterableIterator<T> {
        const cursor = await this.query(query);
        while (true) {
            try {
                yield <T>await cursor.next();
            } catch (err) {
                break;
            }
        }
    }

    public async connect(): Promise<r.Connection> {
        if (!this.#connectionPromise) {
            this.#connectionPromise = r.connect({
                host: this.#options.host,
                db: this.#options.database,
                password: this.#options.password,
                user: this.#options.user,
                port: this.#options.port,
                timeout: 10000
            }).then(conn => this.#connection = conn);
        }

        return await this.#connectionPromise;
    }

    public async disconnect(): Promise<void> {
        if (!this.#connection) {
            if (!this.#connectionPromise) {
                return;
            }

            await this.#connectionPromise;
        }

        if (this.#connection) {
            await this.#connection.close();
            this.#connection = undefined;
            this.#connectionPromise = undefined;
        }
    }
}