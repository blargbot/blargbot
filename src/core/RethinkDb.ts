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
    values: {} | null;
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

export class RethinkDb {
    #connectionPromise?: Promise<r.Connection>
    #connection?: r.Connection
    readonly #options: RethinkDbOptions;

    constructor(options: RethinkDbOptions) {
        this.#options = options;
    }

    async getGuild(guildId: string) {
        return await this.query(r => r.table('guild').get<StoredGuild>(guildId));
    }

    async setGuild(guild: StoredGuild) {
        return await this.query(r => r.table('guild').replace(guild));
    }

    async getUser(userId: string) {
        return await this.query(r => r.table('user').get<StoredUser>(userId));
    }

    async setUser(user: StoredUser) {
        return await this.query(r => r.table('user').replace(user));
    }

    async getTag(tagName: string) {
        return await this.query(r => r.table('tag').get<StoredTag>(tagName));
    }

    async setTag(tag: StoredTag) {
        return await this.query(r => r.table('tag').replace(tag));
    }

    async deleteVar<T extends KnownStoredVars['varname']>(varname: T) {
        return await this.query(r => r.table('vars').get(varname).delete());
    }

    async getVar<T extends KnownStoredVars['varname']>(varname: T) {
        return await this.query(r => r.table('vars').get<GetStoredVar<T>>(varname));
    }

    async setVar<T extends KnownStoredVars['varname']>(value: GetStoredVar<T>) {
        let repl = await this.query(r => r.table('vars').replace(value));
        if (repl.replaced === 1 || repl.inserted === 1)
            return repl;

        return await this.query(r => r.table('vars').insert(value));
    }

    async query<T extends object | null = object>(query: (rethink: typeof r) => r.Operation<T>): Promise<T>
    async query<T extends object | null = object>(query: (rethink: typeof r) => r.Operation<T> | undefined): Promise<T | undefined>
    async query<T extends object | null = object>(query: (rethink: typeof r) => r.Operation<T> | undefined) {
        const connection = this.#connection ?? await this.connect();
        return await query(r)?.run(connection);
    }

    async queryAll<T extends object = object>(query: (rethink: typeof r) => r.Operation<r.Cursor>) {
        const stream = await this.stream<T>(query);
        const result = [];
        for await (let item of stream)
            result.push(item);
        return result;
    }

    async * stream<T extends object = object>(query: (rethink: typeof r) => r.Operation<r.Cursor>) {
        const cursor = await this.query(query);
        while (true) {
            try {
                yield <T>await cursor.next();
            } catch (err) {
                break;
            }
        }
    }

    connect() {
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

        return this.#connectionPromise;
    }

    async disconnect() {
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