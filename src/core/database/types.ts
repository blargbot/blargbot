import { Client as ErisClient, Message, User } from 'eris';
import { Duration, Moment } from 'moment-timezone';
import { FlagDefinition, SubtagVariableType } from '../../utils';
import { Options as SequelizeOptions } from 'sequelize';

export type RethinkTableMap = {
    'guild': StoredGuild;
    'tag': StoredTag;
    'user': StoredUser;
    'vars': KnownStoredVars;
    'events': Omit<StoredEvent, 'id'>
}

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
    endtime: Date;
    source?: string;
    channel?: string;
    guild?: string;
    user?: string;
}

export interface StoredGuild {
    guildid: string;
    active: boolean;
    name: string;
    settings: GuildSettings;
    channels: { [channelId: string]: ChannelSettings | undefined };
    ccommands: { [key: string]: StoredGuildCommand | undefined };
    commandperms?: { [key: string]: CommandPermissions | undefined };
    censor?: GuildCensors;
    warnings?: GuildWarnings;
    modlog?: GuildModlogEntry[];
    roleme?: GuildRolemeEntry[];
    autoresponse?: GuildAutoresponses;
    log?: Record<string, string>;
    logIgnore?: string[];
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
    list: GuildCensor[]
    exception: GuildCensorExceptions;
    rule: GuildCensorRule;
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
    channel: string | string[];
    user: string | string[];
    role: string | string[];
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
    uses: number;
    flags?: FlagDefinition[]
    cooldown?: number;
    lastuse?: Date;
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
    disableeveryone?: boolean;
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
    date: Date
}

export interface StoredUser {
    userid: string;
    dontdmerrors?: boolean;
    prefixes?: string[];
    username?: string;
    usernames: StoredUsername[];
    discriminator?: string;
    avatarURL?: string;
    blacklisted?: boolean;
    isbot: boolean;
    lastspoke: Date;
    lastcommand?: string;
    lastcommanddate?: Date;
    todo: UserTodo[];
}

export interface UserTodo {
    active: 1 | false;
    content: string;
}

export interface Dump {
    id: string;
    content?: string;
    embeds?: string;
    channelid?: string;
}

export const enum ChatlogType {
    CREATE = 0,
    UPDATE = 1,
    DELETE = 2
}

export interface Chatlog {
    id: Snowflake;
    content: string;
    attachment?: string;
    userid: string;
    msgid: string;
    channelid: string;
    guildid: string;
    msgtime: number | Date;
    type: ChatlogType;
    embeds: string | JObject;
}

export interface BBTagVariableReference {
    name: string;
    type: SubtagVariableType;
    scope: string;

}

export interface BBTagVariable extends BBTagVariableReference {
    value: JToken;
}

export interface DatabaseOptions {
    logger: CatLogger;
    discord: ErisClient;
    rethinkDb: RethinkDbOptions;
    cassandra: CassandraDbOptions;
    postgres: PostgresDbOptions;
}

export interface RethinkDbOptions {
    database: string;
    user: string;
    password: string;
    host: string;
    port: number;
}

export interface CassandraDbOptions {
    username: string;
    password: string;
    keyspace: string;
    contactPoints: string[];
}

export interface PostgresDbOptions {
    database: string;
    user: string;
    pass: string;
    host: string;
    sequelize: SequelizeOptions;
}

export interface GuildTable {
    get(guildId: string, skipCache?: boolean): Promise<DeepReadOnly<StoredGuild> | undefined>;
    add(guild: StoredGuild): Promise<boolean>;
    getIds(): Promise<string[]>;
    getSetting<K extends keyof GuildSettings>(guildId: string, key: K, skipCache?: boolean): Promise<DeepReadOnly<GuildSettings>[K] | undefined>;
    setSetting<K extends keyof GuildSettings>(guildId: string, key: K, value: GuildSettings[K]): Promise<boolean>;
    getCommand(guildId: string, commandName: string, skipCache?: boolean): Promise<DeepReadOnly<StoredGuildCommand> | undefined>;
    withIntervalCommand(): Promise<DeepReadOnly<StoredGuild[]> | undefined>;
    updateCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean>;
    setCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean>;
    renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean>;
    addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean>;
    setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean>;
    setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean>;
}

export interface UserTable {
    get(userId: string, skipCache?: boolean): Promise<DeepReadOnly<StoredUser> | undefined>;
    add(user: StoredUser): Promise<boolean>;
    upsert(user: User): Promise<boolean>
}

export interface VarsTable {
    get<K extends KnownStoredVars['varname']>(key: K): Promise<DeepReadOnly<GetStoredVar<K>> | undefined>;
    set<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean>;
    delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean>;
}

export interface EventsTable {
    between(from: Date | Moment | number, to: Date | Moment | number): Promise<StoredEvent[]>;
    add(event: Omit<StoredEvent, 'id'>): Promise<boolean>;
    delete(eventId: string): Promise<boolean>;
    delete(filter: Partial<StoredEvent>): Promise<boolean>;
}

export interface TagsTable {
    get(tagName: string): Promise<DeepReadOnly<StoredTag> | undefined>;
    incrementUses(tagName: string, count?: number): Promise<boolean>;
}

export interface ChatlogsTable {
    add(message: Message, type: ChatlogType, lifespan?: number | Duration): Promise<void>;
    get(messageId: string): Promise<Chatlog | undefined>;
}

export interface DumpsTable {
    add(dump: Dump, lifespan?: number | Duration): Promise<void>;
}

export interface TagVariablesTable {
    upsert(values: Record<string, JToken>, type: SubtagVariableType, scope: string): Promise<void>;
    get(name: string, type: SubtagVariableType, scope: string): Promise<JToken | undefined>;
}