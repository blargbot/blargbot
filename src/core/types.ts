import { FlagDefinition, SerializedBBTagContext } from '@cluster/types'; // TODO Core shouldnt reference cluster
import { SubtagVariableType } from '@cluster/utils/constants/subtagVariableType'; // TODO Core shouldnt reference cluster
import { Logger } from '@core/Logger';
import { ChannelInteraction, Client as Discord, EmbedField, FileOptions, Guild, MessageEmbedOptions, MessageOptions, TextBasedChannels, User, UserChannelInteraction } from 'discord.js';
import { Duration, Moment } from 'moment-timezone';
import { Options as SequelizeOptions } from 'sequelize';

import { Binder } from './Binder';
import { WorkerConnection } from './worker';

export type MalformedEmbed = { fields: [EmbedField]; malformed: boolean; };
export type ModuleResult<TModule> = { names: Iterable<string>; module: TModule; };
export type SendContext = UserChannelInteraction | ChannelInteraction | TextBasedChannels | string
export type SendEmbed = MessageEmbedOptions & { asString?: string; }
export type SendFiles = FileOptions | FileOptions[]
export interface SendPayloadContent extends MessageOptions {
    nsfw?: string;
    isHelp?: boolean;
}
export type SendPayload = SendPayloadContent | string | boolean;
export type LogEntry = { text: string; level: string; timestamp: string; }
export type ProcessMessage = { type: string; id: Snowflake; data: unknown; };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProcessMessageHandler = (data: unknown, id: Snowflake, reply: <T = unknown>(data: T) => void) => void;
export type AnyProcessMessageHandler = (event: string, ...args: Parameters<ProcessMessageHandler>) => void;
export type WorkerPoolEventHandler<TWorker extends WorkerConnection> = (worker: TWorker, ...args: Parameters<ProcessMessageHandler>) => void;
export type EvalRequest = { userId: string; code: string; };
export type MasterEvalRequest = EvalRequest & { type: EvalType; };
export type MasterEvalResult<T = unknown> = Record<string, EvalResult<T>>;
export type EvalResult<T = unknown> = { success: false; error: unknown; } | { success: true; result: T; };
export type EvalType = 'master' | 'global' | `cluster${number}`

export interface Binding<TState> {
    [Binder.binder](state: TState): BindingResult<TState>;
    debugView(): Iterable<string>;
}

export type BindingResult<TState> =
    | BindingResultAsyncIterator<TState>
    | BindingResultIterator<TState>
    | Promise<BindingResultValue<TState>>
    | BindingResultValue<TState>

export type BindingResultIterator<TState> = Iterator<BindingResultValue<TState>, void, void>;
export type BindingResultAsyncIterator<TState> = AsyncIterator<BindingResultValue<TState>, void, void>;

export type BindingResultValue<TState> =
    | BindingSuccess<TState>
    | BindingFailure<TState>

export interface BindingSuccess<TState> {
    readonly success: true;
    readonly state: TState;
    readonly next: ReadonlyArray<Binding<TState>>;
    readonly checkNext: boolean;
}

export interface BindingFailure<TState> {
    readonly success: false;
    readonly state: TState;
}

export interface BinderResult<TState> {
    readonly success: boolean;
    readonly state: TState;
}

export type RethinkTableMap = {
    'guild': MutableStoredGuild;
    'tag': StoredTag;
    'user': MutableStoredUser;
    'vars': MutableKnownStoredVars;
    'events': StoredEvent;
}

export interface MessageFilter {
    readonly term: string;
    readonly regex: boolean;
}

export interface StoredVar<T extends string> {
    readonly varname: T;
}

export interface RestartStoredVar extends StoredVar<'restart'> {
    readonly varvalue: {
        readonly channel: string;
        readonly time: number;
    };
}

export interface TagVarsStoredVar extends StoredVar<'tagVars'> {
    readonly values: { readonly [key: string]: unknown; } | undefined;
}

export interface ARWhitelistStoredVar extends StoredVar<'arwhitelist'> {
    readonly values: readonly string[];
}

export interface GuildBlacklistStoredVar extends StoredVar<'guildBlacklist'> {
    readonly values: { readonly [guildid: string]: boolean | undefined; };
}

export interface BlacklistStoredVar extends StoredVar<'blacklist'> {
    readonly users: readonly string[];
    readonly guilds: readonly string[];
}

export interface WhitelistedDomainsStoredVar extends StoredVar<'whitelistedDomains'> {
    readonly values: { readonly [domain: string]: boolean; };
}

export interface ChangelogStoredVar extends StoredVar<'changelog'> {
    readonly guilds: { readonly [guildid: string]: string; };
}

export interface PGStoredVar extends StoredVar<'pg'> {
    readonly value: number;
}

export interface PoliceStoredVar extends StoredVar<'police'> {
    readonly value: readonly string[];
}

export interface SupportStoredVar extends StoredVar<'support'> {
    readonly value: readonly string[];
}

export interface CleverStatsStoredVar extends StoredVar<'cleverstats'> {
    readonly stats: { readonly [date: string]: { readonly uses: number; }; };
}

export interface VersionStoredVar extends StoredVar<'version'> {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
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

export type MutableKnownStoredVars =
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

export type GetStoredVar<T extends KnownStoredVars['varname']> = Extract<KnownStoredVars, { varname: T; }>;

export interface StoredEventOptionsBase {
    readonly source: string;
    readonly channel?: string;
    readonly guild?: string;
    readonly endtime: number;
}

export interface UnmuteEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}

export interface UnbanEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}

export interface TimerEventOptions extends StoredEventOptionsBase {
    readonly channel: string;
    readonly user: string;
}

export interface RemindEventOptions extends StoredEventOptionsBase {
    readonly channel: string;
    readonly user: string;
    readonly content: string;
}

export interface TagStoredEventOptionsBase<Version> extends StoredEventOptionsBase {
    readonly version: Version;
}

export interface TagV4StoredEventOptions extends TagStoredEventOptionsBase<4> {
    readonly source: string;
    readonly context: SerializedBBTagContext;
    readonly content: string;
}

export type TagStoredEventOptions =
    | TagStoredEventOptionsBase<undefined>
    | TagStoredEventOptionsBase<0>
    | TagStoredEventOptionsBase<1>
    | TagStoredEventOptionsBase<2>
    | TagStoredEventOptionsBase<3>
    | TagV4StoredEventOptions;

export type EventOptionsTypeMap = {
    'tag': TagStoredEventOptions;
    'unmute': UnmuteEventOptions;
    'unban': UnbanEventOptions;
    'timer': TimerEventOptions;
    'remind': RemindEventOptions;
}

export type EventTypeMap = {
    [K in EventType]: EventOptionsTypeMap[K] & {
        readonly id: string;
        readonly type: K;
        readonly starttime: number;
    };
}

export type EventType = keyof EventOptionsTypeMap;

export type StoredEventOptions<K extends EventType = EventType> = EventOptionsTypeMap[K];
export type StoredEvent<K extends EventType = EventType> = EventTypeMap[K];

export interface StoredGuild {
    readonly guildid: string;
    readonly active: boolean;
    readonly name: string;
    readonly settings: StoredGuildSettings;
    readonly channels: { readonly [channelId: string]: ChannelSettings | undefined; };
    readonly ccommands: { readonly [key: string]: StoredGuildCommand | undefined; };
    readonly commandperms?: { readonly [key: string]: CommandPermissions | undefined; };
    readonly censor?: GuildCensors;
    readonly warnings?: GuildWarnings;
    readonly modlog?: readonly GuildModlogEntry[];
    readonly roleme?: readonly GuildRolemeEntry[];
    readonly autoresponse?: GuildAutoresponses;
    readonly log?: { readonly [key: string]: string | undefined; };
    readonly logIgnore?: readonly string[];
    readonly votebans?: { readonly [userId: string]: readonly string[] | undefined; };
}

export type StoredGuildEventLogType =
    | `role:${string}`
    | 'messagedelete'
    | 'messageupdate'
    | 'nameupdate'
    | 'avatarupdate'
    | 'nickupdate'
    | 'memberjoin'
    | 'memberleave'
    | 'memberunban'
    | 'memberban'
    | 'kick';

export interface MutableStoredGuild extends StoredGuild {
    votebans?: { [userId: string]: string[] | undefined; };
    ccommands: { [key: string]: StoredGuildCommand | undefined; };
    warnings?: MutableGuildWarnings;
    modlog?: GuildModlogEntry[];
    log?: { [key: string]: string | undefined; };
    logIgnore?: string[];
    autoresponse?: MutableGuildAutoresponses;
    active: boolean;
    name: string;
}

export interface GuildAutoresponses {
    readonly everything?: GuildAutoresponse;
    readonly list?: readonly GuildFilteredAutoresponse[];
}
export interface MutableGuildAutoresponses extends GuildAutoresponses {
    everything?: GuildAutoresponse;
    list?: GuildFilteredAutoresponse[];
}

export interface GuildAutoresponse {
    readonly executes: string;
}

export interface GuildFilteredAutoresponse extends GuildAutoresponse, MessageFilter {
}

export interface GuildRolemeEntry {
    readonly channels: readonly string[];
    readonly casesensitive: boolean;
    readonly message: string;
    readonly add?: readonly string[];
    readonly remove?: readonly string[];
    readonly output?: string;
}

export interface GuildWarnings {
    readonly users?: { readonly [userId: string]: number | undefined; };
}
export interface MutableGuildWarnings {
    users?: { [userId: string]: number | undefined; };
}

export interface GuildCensors {
    readonly list: readonly GuildCensor[];
    readonly exception?: GuildCensorExceptions;
    readonly rule?: GuildCensorRule;
}

export interface GuildCensorRule {
    readonly deleteMessage?: string;
    readonly banMessage?: string;
    readonly kickMessage?: string;
}

export interface GuildCensor extends GuildCensorRule, MessageFilter {
    readonly weight: number;
    readonly reason?: string;
}

export interface GuildCensorExceptions {
    readonly channel: string | readonly string[];
    readonly user: string | readonly string[];
    readonly role: string | readonly string[];
}

export interface StoredRawGuildCommand {
    readonly content: string;
    readonly author: string;
    readonly help?: string;
    readonly lang?: string;
    readonly authorizer?: string;
    readonly hidden?: boolean;
    readonly managed?: boolean;
    readonly roles?: readonly string[];
    readonly uses?: number;
    readonly flags?: readonly FlagDefinition[];
    readonly cooldown?: number;
}

export interface NamedStoredRawGuildCommand extends StoredRawGuildCommand {
    readonly name: string;
}

export interface StoredAliasedGuildCommand {
    readonly alias: string;
    readonly author: string;
    readonly authorizer?: string;
    readonly hidden?: boolean;
    readonly roles?: readonly string[];
    readonly cooldown?: number;
    readonly help?: string;
}

export interface NamedStoredAliasedGuildCommand extends StoredAliasedGuildCommand {
    readonly name: string;
}

export type StoredGuildCommand = StoredAliasedGuildCommand | StoredRawGuildCommand;
export type NamedStoredGuildCommand = NamedStoredAliasedGuildCommand | NamedStoredRawGuildCommand;

export interface CommandPermissions {
    readonly disabled?: boolean;
    readonly permission?: number;
    readonly rolename?: string | readonly string[];
}

export interface StoredTag {
    readonly name: string;
    readonly content: string;
    readonly author: string;
    readonly authorizer?: string;
    readonly uses: number;
    readonly flags?: readonly FlagDefinition[];
    readonly cooldown?: number;
    readonly lastuse?: Date;
    readonly lastmodified: Date;
    readonly deleted?: boolean;
    readonly lang?: string;
    readonly deleter?: string;
    readonly reason?: string;
    readonly favourites?: { readonly [key: string]: boolean | undefined; };
    readonly reports?: number;
}

export interface StoredGuildSettings {
    readonly permoverride?: boolean;
    readonly staffperms?: number | string;
    readonly social?: boolean;
    readonly makelogs?: boolean;
    readonly prefix?: readonly string[] | string;
    readonly nocleverbot?: boolean;
    readonly tableflip?: boolean;
    readonly disablenoperms?: boolean;
    readonly adminrole?: string;
    readonly antimention?: number;
    readonly banat?: number;
    readonly kickat?: number;
    readonly modlog?: string;
    readonly deletenotif?: boolean;
    readonly disableeveryone?: boolean;
    readonly greeting?: StoredRawGuildCommand;
    readonly greetChan?: string;
    readonly farewell?: StoredRawGuildCommand;
    readonly farewellchan?: string;
    readonly mutedrole?: string;
    readonly dmhelp?: boolean;
    readonly kickoverride?: number;
    readonly banoverride?: number;
}

export interface GuildModlogEntry {
    readonly caseid: number;
    readonly modid?: string;
    readonly msgid?: string;
    readonly reason?: string;
    readonly type: string;
    readonly userid: string;
}

export interface ChannelSettings {
    readonly blacklisted?: boolean;
    readonly nsfw?: boolean;
}

export interface StoredUsername {
    readonly name: string;
    readonly date: Date;
}

export interface StoredUser extends StoredUserSettings {
    readonly userid: string;
    readonly username?: string;
    readonly usernames: readonly StoredUsername[];
    readonly discriminator?: string;
    readonly avatarURL?: string;
    readonly isbot: boolean;
    readonly lastspoke: Date;
    readonly lastcommand?: string;
    readonly lastcommanddate?: Date;
    readonly todo: readonly UserTodo[];
    readonly reportblock?: string;
    readonly reports?: { readonly [key: string]: string | undefined; };
}

export interface MutableStoredUser extends StoredUser {
    usernames: StoredUsername[];
    username?: string;
    discriminator?: string;
    avatarURL?: string;
    reports?: { [key: string]: string | undefined; };
}

export interface StoredUserSettings {
    readonly dontdmerrors?: boolean;
    readonly prefixes?: readonly string[];
    readonly blacklisted?: string;
    readonly timezone?: string;
}

export interface UserTodo {
    readonly active: 1 | false;
    readonly content: string;
}

export interface Dump {
    readonly id: string;
    readonly content?: string;
    readonly embeds?: string;
    readonly channelid?: string;
}

export const enum ChatlogType {
    CREATE = 0,
    UPDATE = 1,
    DELETE = 2
}

export interface ChatlogMessage {
    readonly content: string;
    readonly attachment: string | undefined;
    readonly userid: string;
    readonly msgid: string;
    readonly channelid: string;
    readonly guildid: string;
    readonly embeds: string;
}

export interface Chatlog extends ChatlogMessage {
    readonly id: Snowflake;
    readonly msgtime: Date;
    readonly type: ChatlogType;
}

export interface BBTagVariable {
    readonly name: string;
    readonly type: SubtagVariableType;
    readonly scope: string;
    content: string;
}

export interface DatabaseOptions {
    readonly logger: Logger;
    readonly discord: Discord<true>;
    readonly rethinkDb: RethinkDbOptions;
    readonly cassandra: CassandraDbOptions;
    readonly postgres: PostgresDbOptions;
}

export interface RethinkDbOptions {
    readonly database: string;
    readonly user: string;
    readonly password: string;
    readonly host: string;
    readonly port: number;
}

export interface CassandraDbOptions {
    readonly username: string;
    readonly password: string;
    readonly keyspace: string;
    readonly contactPoints: readonly string[];
}

export interface PostgresDbOptions {
    readonly database: string;
    readonly user: string;
    readonly pass: string;
    readonly host: string;
    readonly sequelize: SequelizeOptions;
}

export interface StoredGuildEventLogConfig {
    readonly events: { readonly [P in StoredGuildEventLogType]?: string | undefined; };
    readonly roles: { readonly [roleId: string]: string | undefined; };
}

export interface MutableStoredGuildEventLogConfig extends StoredGuildEventLogConfig {
    events: { [P in StoredGuildEventLogType]?: string | undefined; };
    roles: { [roleId: string]: string | undefined; };
}

export interface GuildTable {
    clearVoteBans(guildId: string, userId: string): Promise<void>;
    getAutoresponse(guildId: string, index: number, skipCache?: boolean): Promise<GuildFilteredAutoresponse | undefined>;
    getAutoresponse(guildId: string, index: 'everything', skipCache?: boolean): Promise<GuildAutoresponse | undefined>;
    getAutoresponse(guildId: string, index: number | 'everything', skipCache?: boolean): Promise<GuildAutoresponse | GuildFilteredAutoresponse | undefined>;
    getAutoresponses(guildId: string, skipCache?: boolean): Promise<GuildAutoresponses>;
    setAutoresponse(guildId: string, index: number, autoresponse: GuildFilteredAutoresponse | undefined): Promise<boolean>;
    setAutoresponse(guildId: string, index: 'everything', autoresponse: GuildAutoresponse | undefined): Promise<boolean>;
    setAutoresponse(guildId: string, index: number | 'everything', autoresponse: undefined): Promise<boolean>;
    addAutoresponse(guildId: string, autoresponse: GuildFilteredAutoresponse): Promise<boolean>;
    getChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, skipCache?: boolean): Promise<ChannelSettings[K] | undefined>;
    getRolemes(guildId: string, skipCache?: boolean): Promise<readonly GuildRolemeEntry[]>;
    getCensors(guildId: string, skipCache?: boolean): Promise<GuildCensors | undefined>;
    listCommands(guildId: string, skipCache?: boolean): Promise<readonly NamedStoredGuildCommand[]>;
    get(guildId: string, skipCache?: boolean): Promise<StoredGuild | undefined>;
    upsert(guild: Guild): Promise<'inserted' | 'updated' | false>;
    exists(guildId: string, skipCache?: boolean): Promise<boolean>;
    isActive(guildId: string, skipCache?: boolean): Promise<boolean>;
    setActive(guildId: string, active?: boolean): Promise<boolean>;
    getIds(skipCache?: boolean): Promise<readonly string[]>;
    getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache?: boolean): Promise<StoredGuildSettings[K] | undefined>;
    setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean>;
    getCommand(guildId: string, commandName: string, skipCache?: boolean): Promise<NamedStoredGuildCommand | undefined>;
    withIntervalCommand(skipCache?: boolean): Promise<readonly string[]>;
    updateCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean>;
    setCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean>;
    setCommandProp<K extends keyof StoredRawGuildCommand>(guildId: string, commandName: string, key: K, value: StoredRawGuildCommand[K]): Promise<boolean>;
    setCommandProp<K extends keyof StoredAliasedGuildCommand>(guildId: string, commandName: string, key: K, value: StoredAliasedGuildCommand[K]): Promise<boolean>;
    setCommandProp<K extends keyof StoredGuildCommand>(guildId: string, commandName: string, key: K, value: StoredGuildCommand[K]): Promise<boolean>;
    renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean>;
    getNewModlogCaseId(guildId: string, skipCache?: boolean): Promise<number | undefined>;
    addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean>;
    getLogIgnores(guildId: string, skipCache?: boolean): Promise<ReadonlySet<string>>;
    getLogChannel(guildId: string, type: StoredGuildEventLogType, skipCache?: boolean): Promise<string | undefined>;
    getLogChannels(guildId: string, skipCache?: boolean): Promise<StoredGuildEventLogConfig>;
    setLogChannel(guildId: string, event: StoredGuildEventLogType, channel: string | undefined): Promise<boolean>;
    setLogChannel(guildId: string, events: StoredGuildEventLogType[], channel: string | undefined): Promise<boolean>;
    setLogIgnores(guildId: string, userIds: readonly string[], ignore: boolean): Promise<boolean>;
    getWarnings(guildId: string, userId: string, skipCache?: boolean): Promise<number | undefined>;
    setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean>;
    getCommandPerms(guildId: string, commandName: string, skipCache?: boolean): Promise<CommandPermissions | undefined>;
}

export interface UserTable {
    getSetting<K extends keyof StoredUserSettings>(userId: string, key: K, skipCache?: boolean): Promise<StoredUserSettings[K] | undefined>;
    get(userId: string, skipCache?: boolean): Promise<StoredUser | undefined>;
    upsert(user: User): Promise<'inserted' | 'updated' | false>;
    setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean>;
}

export interface VarsTable {
    get<K extends KnownStoredVars['varname']>(key: K): Promise<GetStoredVar<K> | undefined>;
    set<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean>;
    delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean>;
}

export interface EventsTable {
    list(source: string, pageNumber: number, pageSize: number): Promise<{ events: readonly StoredEvent[]; total: number; }>;
    between(from: Date | Moment | number, to: Date | Moment | number): Promise<readonly StoredEvent[]>;
    add<K extends EventType>(type: K, event: StoredEventOptions<K>): Promise<StoredEvent<K> | undefined>;
    delete(eventId: string): Promise<boolean>;
    delete(filter: Partial<StoredEventOptions>): Promise<readonly string[]>;
    getIds(source: string): Promise<readonly string[]>;
    get(id: string): Promise<StoredEvent | undefined>;
}

export interface TagsTable {
    list(skip: number, take: number): Promise<readonly string[]>;
    count(): Promise<number>;
    byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]>;
    byAuthorCount(userId: string): Promise<number>;
    search(partialName: string, skip: number, take: number): Promise<readonly string[]>;
    searchCount(partialName: string): Promise<number>;
    delete(name: string): Promise<boolean>;
    disable(tagName: string, userId: string, reason: string): Promise<boolean>;
    top(count: number): Promise<readonly StoredTag[]>;
    get(tagName: string): Promise<StoredTag | undefined>;
    set(tag: StoredTag): Promise<boolean>;
    setProp<K extends keyof StoredTag>(tagName: string, key: K, value: StoredTag[K]): Promise<boolean>;
    add(tag: StoredTag): Promise<boolean>;
    incrementUses(tagName: string, count?: number): Promise<boolean>;
    incrementReports(tagName: string, count?: number): Promise<boolean>;
    getFavourites(userId: string): Promise<readonly string[]>;
    setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean>;
}

export interface ChatlogsTable {
    add(message: ChatlogMessage, type: ChatlogType, lifespan?: number | Duration): Promise<void>;
    get(messageId: string): Promise<Chatlog | undefined>;
}

export interface DumpsTable {
    add(dump: Dump, lifespan?: number | Duration): Promise<void>;
}

export interface TagVariablesTable {
    upsert(values: Record<string, JToken>, type: SubtagVariableType, scope: string): Promise<void>;
    get(name: string, type: SubtagVariableType, scope: string): Promise<JToken>;
}
export type TypeMappingResult<T> = { valid: false; } | { valid: true; value: T; };
export type TypeMapping<T, TArgs extends unknown[] = []> = (value: unknown, ...args: TArgs) => TypeMappingResult<T>;
export type TypeMappings<T> = { readonly [P in keyof T]-?: TypeMapping<T[P]> | [string, TypeMapping<T[P]>] | [T[P]] };
