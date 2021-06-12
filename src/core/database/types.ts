import { AnyMessage, Client as ErisClient, User } from 'eris';
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
    settings: StoredGuildSettings;
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

export interface NamedStoredGuildCommand extends StoredGuildCommand {
    name: string;
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
    rolename?: string | string[];
}

export interface StoredTag {
    name: string;
    content: string;
    author: string;
    authorizer?: string;
    uses: number;
    flags?: FlagDefinition[]
    cooldown?: number;
    lastuse?: Date;
    lastmodified: Date;
    deleted?: boolean;
    lang?: string;
    deleter?: string;
    reason?: string;
    favourites?: Record<string, boolean | undefined>;
    reports?: number;
}

export interface StoredGuildSettings {
    permoverride?: boolean;
    staffperms?: number | string;
    social?: boolean;
    makelogs?: boolean;
    prefix?: string[] | string;
    nocleverbot?: boolean;
    tableflip?: boolean;
    disablenoperms?: boolean;
    adminrole?: string;
    antimention?: number;
    banat?: number;
    kickat?: number;
    modlog?: string;
    deletenotif?: boolean;
    disableeveryone?: boolean;
    greeting?: string;
    greetChan?: string;
    farewell?: string;
    farewellchan?: string;
    mutedrole?: string;
    dmhelp?: boolean;
    kickoverride?: number;
    banoverride?: number;
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
    nsfw?: boolean;
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
    reportblock?: string;
    reports?: Record<string, string>;
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
    listCommands(guildId: string, skipCache?: boolean): Promise<DeepReadOnly<NamedStoredGuildCommand[]>>;
    get(guildId: string, skipCache?: boolean): Promise<DeepReadOnly<StoredGuild> | undefined>;
    add(guild: StoredGuild): Promise<boolean>;
    getIds(skipCache?: boolean): Promise<string[]>;
    getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache?: boolean): Promise<DeepReadOnly<StoredGuildSettings>[K] | undefined>;
    setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean>;
    getCommand(guildId: string, commandName: string, skipCache?: boolean): Promise<DeepReadOnly<StoredGuildCommand> | undefined>;
    withIntervalCommand(skipCache?: boolean): Promise<DeepReadOnly<StoredGuild[]> | undefined>;
    updateCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean>;
    setCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean>;
    renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean>;
    addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean>;
    setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean>;
    setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean>;
    getCommandPerms(guildId: string, commandName: string, skipCache?: boolean): Promise<DeepReadOnly<CommandPermissions> | undefined>;
}

export interface UserTable {
    get(userId: string, skipCache?: boolean): Promise<DeepReadOnly<StoredUser> | undefined>;
    add(user: StoredUser): Promise<boolean>;
    upsert(user: User): Promise<boolean>
    setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean>;
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
    setLanguage(tagName: string, language: string | undefined): Promise<boolean>;
    list(skip: number, take: number): Promise<readonly string[]>;
    count(): Promise<number>;
    byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]>;
    byAuthorCount(userId: string): Promise<number>;
    search(partialName: string, skip: number, take: number): Promise<readonly string[]>;
    searchCount(partialName: string): Promise<number>;
    delete(name: string): Promise<boolean>;
    disable(tagName: string, userId: string, reason: string): Promise<boolean>;
    top(count: number): Promise<DeepReadOnly<StoredTag[]>>;
    get(tagName: string): Promise<DeepReadOnly<StoredTag> | undefined>;
    set(tag: StoredTag): Promise<boolean>;
    set(tag: DeepReadOnly<StoredTag>): Promise<boolean>;
    add(tag: StoredTag): Promise<boolean>;
    add(tag: DeepReadOnly<StoredTag>): Promise<boolean>;
    setFlags(tagName: string, flags: FlagDefinition[]): Promise<boolean>;
    incrementUses(tagName: string, count?: number): Promise<boolean>;
    incrementReports(tagName: string, count?: number): Promise<boolean>;
    setCooldown(tagName: string, cooldown: number | undefined): Promise<boolean>;
    getFavourites(userId: string): Promise<readonly string[]>;
    setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean>;
}

export interface ChatlogsTable {
    add(message: AnyMessage, type: ChatlogType, lifespan?: number | Duration): Promise<void>;
    get(messageId: string): Promise<Chatlog | undefined>;
}

export interface DumpsTable {
    add(dump: Dump, lifespan?: number | Duration): Promise<void>;
}

export interface TagVariablesTable {
    upsert(values: Record<string, string | undefined>, type: SubtagVariableType, scope: string): Promise<void>;
    get(name: string, type: SubtagVariableType, scope: string): Promise<string | undefined>;
}