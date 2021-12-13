import type { FlagDefinition, SerializedBBTagContext } from '@cluster/types'; // TODO Core shouldnt reference cluster
import { Logger } from '@core/Logger';
import { Snowflake } from 'catflake';
import { AdvancedMessageContent, ChannelInteraction, Client as Discord, Embed, EmbedField, EmbedOptions, FileContent, Guild, InteractionButton, KnownMessage, KnownTextableChannel, Member, SelectMenuOptions, User, UserChannelInteraction } from 'eris';
import { Duration, Moment } from 'moment-timezone';

import { Binder } from './Binder';
import { AirtableConfiguration, CassandraConfiguration, PostgresConfiguration, RethinkConfiguration } from './Configuration';
import { WorkerConnection } from './worker';

export type MalformedEmbed = { fields: [EmbedField]; malformed: true; };
export type ModuleResult<TModule> = { names: Iterable<string>; module: TModule; };
export type DMContext = string | KnownMessage | User | Member;
export type SendContext = UserChannelInteraction | ChannelInteraction | KnownTextableChannel | string
export type SendEmbed = EmbedOptions & { asString?: string; }
export type SendFiles = FileContent | FileContent[]
export interface SendContent extends AdvancedMessageContent {
    nsfw?: string;
    isHelp?: boolean;
    replyToExecuting?: boolean;
    files?: FileContent[];
}
export type SendPayload = SendContent | EmbedOptions | string | FileContent;
export type LogEntry = { text: string; level: string; timestamp: string; }
export type ProcessMessage = { type: string; id: Snowflake; data: unknown; };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProcessMessageContext<TData, TReply> = { data: TData; id: Snowflake; reply: (data: TReply) => void; };
export type WorkerPoolEventContext<TWorker extends WorkerConnection<string, IPCContracts>, TData, TReply> = ProcessMessageContext<TData, TReply> & { worker: TWorker; };
export type ProcessMessageHandler<TData = unknown, TReply = unknown> = (context: ProcessMessageContext<TData, TReply>) => unknown;
export type WorkerPoolEventHandler<TWorker extends WorkerConnection<string, IPCContracts>, TData = unknown, TReply = unknown> = (context: WorkerPoolEventContext<TWorker, TData, TReply>) => unknown;
export type EvalRequest = { userId: string; code: string; };
export type MasterEvalRequest = EvalRequest & { type: EvalType; };
export type GlobalEvalResult = Record<string, EvalResult>;
export type EvalResult = { success: false; error: unknown; } | { success: true; result: unknown; };
export type EvalType = 'master' | 'global' | `cluster${number}`

export type IPCContract<Worker, Master> = { workerGets: Worker; masterGets: Master; };
export type IPCContracts<ContractNames extends string = string> = { [ContractName in ContractNames]: IPCContract<unknown, unknown> }
export type IPCContractNames<Contracts extends IPCContracts> = string & keyof (Contracts & BaseIPCContract);

export type IPCContractMasterGets<Contracts extends IPCContracts, Contract extends IPCContractNames<Contracts>> = (Contracts & BaseIPCContract)[Contract]['masterGets']
export type IPCContractWorkerGets<Contracts extends IPCContracts, Contract extends IPCContractNames<Contracts>> = (Contracts & BaseIPCContract)[Contract]['workerGets']

export type GetMasterProcessMessageHandler<Contracts extends IPCContracts, Contract extends IPCContractNames<Contracts>> =
    ProcessMessageHandler<IPCContractMasterGets<Contracts, Contract>, IPCContractWorkerGets<Contracts, Contract>>
export type GetWorkerProcessMessageHandler<Contracts extends IPCContracts, Contract extends IPCContractNames<Contracts>> =
    ProcessMessageHandler<IPCContractWorkerGets<Contracts, Contract>, IPCContractMasterGets<Contracts, Contract>>
export type GetWorkerPoolEventHandler<Worker extends WorkerConnection<string, IPCContracts>, Contract extends WorkerIPCContractNames<Worker>> =
    Worker extends WorkerConnection<string, infer Contracts>
    ? WorkerPoolEventHandler<Worker, IPCContractMasterGets<Contracts, Contract>, IPCContractWorkerGets<Contracts, Contract>>
    : never;

export type WorkerIPCContractNames<Worker extends WorkerConnection<string, IPCContracts>> =
    Worker extends WorkerConnection<string, infer Contracts>
    ? IPCContractNames<Contracts>
    : never;

export type BaseIPCContract = {
    'stop': { masterGets: undefined; workerGets: undefined; };
    'ready': { masterGets: string; workerGets: never; };
    'log': { masterGets: LogEntry; workerGets: never; };
    'alive': { masterGets: Date; workerGets: never; };
    'exit': { masterGets: { code: number | null; signal: NodeJS.Signals | null; }; workerGets: never; };
    'close': { masterGets: { code: number | null; signal: NodeJS.Signals | null; }; workerGets: never; };
    'disconnect': { masterGets: undefined; workerGets: never; };
    'kill': { masterGets: unknown; workerGets: never; };
    'error': { masterGets: Error; workerGets: never; };
}

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

type ConfirmQueryOptionsFallback<T extends boolean | undefined> = T extends undefined
    ? { fallback?: undefined; }
    : { fallback: boolean; };

export interface QueryOptionsBase {
    context: KnownTextableChannel | KnownMessage;
    actors: Iterable<string | User> | string | User;
    prompt?: string | Omit<SendContent, 'components'>;
    timeout?: number;
}

export interface QueryBase<T> {
    getResult(): Promise<T>;
    cancel(): void | Promise<void>;
}

export type QueryResult<TStates extends string, TResult> = QueryBaseResult<TStates> | QuerySuccess<TResult>;

export interface QueryBaseResult<T extends string> {
    readonly state: T;
}

export interface QuerySuccess<T> extends QueryBaseResult<'SUCCESS'> {
    readonly value: T;
}

export interface ConfirmQueryOptionsBase extends QueryOptionsBase {
    confirm: QueryButton;
    cancel: QueryButton;
}

export type ConfirmQueryOptions<T extends boolean | undefined = undefined> = ConfirmQueryOptionsBase & ConfirmQueryOptionsFallback<T>;

export interface ChoiceQueryOptions<T> extends QueryOptionsBase {
    placeholder: string;
    choices: Iterable<Omit<SelectMenuOptions, 'value'> & { value: T; }>;
}

export interface TextQueryOptionsBase<T> extends QueryOptionsBase {
    cancel?: QueryButton;
    parse?: TextQueryOptionsParser<T>;
}

export interface TextQueryOptionsParsed<T> extends TextQueryOptionsBase<T> {
    parse: TextQueryOptionsParser<T>;
}

export type SlimTextQueryOptionsParsed<T> = Omit<TextQueryOptionsParsed<T>, 'context' | 'actors'>;

export interface TextQueryOptions extends TextQueryOptionsBase<string> {
    parse?: undefined;
}

export type SlimTextQueryOptions = Omit<TextQueryOptions, 'context' | 'actors'>;

export interface TextQueryOptionsParser<T> {
    (message: KnownMessage): Promise<TextQueryOptionsParseResult<T>> | TextQueryOptionsParseResult<T>;
}

export type TextQueryOptionsParseResult<T> =
    | { readonly success: true; readonly value: T; }
    | { readonly success: false; readonly error?: string | Omit<SendContent, 'components'>; }

export interface MultipleQueryOptions<T> extends ChoiceQueryOptions<T> {
    minCount?: number;
    maxCount?: number;
}

export interface ChoiceQuery<T> extends QueryBase<ChoiceQueryResult<T>> {
    prompt: KnownMessage | undefined;
}

export interface MultipleQuery<T> extends QueryBase<MultipleResult<T>> {
    prompt: KnownMessage | undefined;
}

export interface ConfirmQuery<T extends boolean | undefined = undefined> extends QueryBase<T> {
    prompt: KnownMessage | undefined;
}

export interface TextQuery<T> extends QueryBase<TextQueryResult<T>> {
    messages: readonly KnownMessage[];
}

export type ChoiceQueryResult<T> = QueryResult<'NO_OPTIONS' | 'TIMED_OUT' | 'CANCELLED' | 'FAILED', T>;
export type MultipleResult<T> = QueryResult<'NO_OPTIONS' | 'EXCESS_OPTIONS' | 'TIMED_OUT' | 'CANCELLED' | 'FAILED', T[]>;
export type TextQueryResult<T> = QueryResult<'FAILED' | 'TIMED_OUT' | 'CANCELLED', T>;

export type QueryButton =
    | string
    | Partial<Omit<InteractionButton, 'disabled' | 'type' | 'customId'>>

export type EntityQueryOptions<T> =
    | EntityPickQueryOptions<T>
    | EntityFindQueryOptions

export type SlimEntityQueryOptions<T> =
    | SlimEntityPickQueryOptions<T>
    | SlimEntityFindQueryOptions

export interface BaseEntityQueryOptions extends QueryOptionsBase {
    placeholder?: string;
}

export interface EntityPickQueryOptions<T> extends BaseEntityQueryOptions {
    choices: Iterable<T>;
    filter?: string;
}

export type SlimEntityPickQueryOptions<T> = Omit<EntityPickQueryOptions<T>, 'context' | 'actors'>;

export interface EntityFindQueryOptions extends BaseEntityQueryOptions {
    guild: string | Guild;
    filter?: string;
}

export type SlimEntityFindQueryOptions = Omit<EntityFindQueryOptions, 'context' | 'actors'>;

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

/* eslint-disable @typescript-eslint/naming-convention */
export interface Suggestor {
    ID: string;
    Username: string;
}

export interface Suggestion {
    ID?: number;
    AA: boolean;
    Bug: boolean;
    Type: string[];
    Title: string;
    Description: string;
    KnownMessage: string;
    Channel: string;
    Author: string[];
    Edits?: number;
    Notes?: string;
    'Last Edited'?: number;
}
/* eslint-enable @typescript-eslint/naming-convention */

export interface MessageFilter {
    readonly term: string;
    readonly regex: boolean;
    readonly decancer?: boolean;
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
    | PGStoredVar
    | PoliceStoredVar
    | SupportStoredVar
    | VersionStoredVar
    | CleverStatsStoredVar

export type GetStoredVar<T extends KnownStoredVars['varname']> = Omit<Extract<KnownStoredVars, { varname: T; }>, 'varname'>;

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

export interface PollEventOptions extends StoredEventOptionsBase {
    readonly color: number;
    readonly channel: string;
    readonly guild: string;
    readonly user: string;
    readonly msg: string;
    readonly content: string;
    readonly strict?: readonly string[];
}

export type EventOptionsTypeMap = {
    'tag': TagStoredEventOptions;
    'unmute': UnmuteEventOptions;
    'unban': UnbanEventOptions;
    'timer': TimerEventOptions;
    'remind': RemindEventOptions;
    'poll': PollEventOptions;
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
    readonly ccommands: { readonly [key: string]: GuildCommandTag | undefined; };
    readonly commandperms?: { readonly [key: string]: CommandPermissions | undefined; };
    readonly censor?: GuildCensors;
    readonly warnings?: GuildWarnings;
    readonly modlog?: readonly GuildModlogEntry[];
    readonly nextModlogId?: number;
    readonly roleme?: GuildRolemes;
    readonly autoresponse?: GuildAutoresponses;
    readonly announce?: GuildAnnounceOptions;
    readonly log?: { readonly [key: string]: string | undefined; /* channelid */ };
    readonly logIgnore?: readonly string[]; // userids
    readonly votebans?: GuildVotebans;
    readonly interval?: GuildTriggerTag;
    readonly greeting?: GuildTriggerTag;
    readonly farewell?: GuildTriggerTag;
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
    votebans?: MutableGuildVotebans;
    ccommands: { [key: string]: GuildCommandTag | undefined; };
    channels: { [channelId: string]: ChannelSettings | undefined; };
    commandperms?: { [key: string]: MutableCommandPermissions | undefined; };
    settings: MutableStoredGuildSettings;
    warnings?: MutableGuildWarnings;
    modlog?: GuildModlogEntry[];
    censor?: MutableGuildCensors;
    roleme?: MutableGuildRolemes;
    log?: { [key: string]: string | undefined; };
    logIgnore?: string[];
    autoresponse?: MutableGuildAutoresponses;
    active: boolean;
    name: string;
    announce?: GuildAnnounceOptions;
    interval?: GuildTriggerTag;
    greeting?: GuildTriggerTag;
    farewell?: GuildTriggerTag;
}

export interface GuildVoteban {
    readonly id: string; // userid
    readonly reason?: string;
}

export interface GuildVotebans {
    readonly [userId: string]: readonly GuildVoteban[] | undefined;
}

export interface MutableGuildVotebans extends GuildVotebans {
    [userId: string]: GuildVoteban[] | undefined;
}

export interface GuildAnnounceOptions {
    readonly channel: string; // channelid
    readonly role: string; // roleid
}

export interface GuildAutoresponses {
    readonly everything?: GuildAutoresponse;
    readonly filtered?: { readonly [key: string]: GuildFilteredAutoresponse | undefined; };
}
export interface MutableGuildAutoresponses extends GuildAutoresponses {
    everything?: GuildAutoresponse;
    filtered?: { [key: string]: GuildFilteredAutoresponse | undefined; };
}

export interface GuildAutoresponse {
    readonly executes: GuildTriggerTag;
}

export interface GuildFilteredAutoresponse extends GuildAutoresponse, MessageFilter {
}

export interface GuildRolemes {
    readonly [id: string]: GuildRolemeEntry | undefined;
}

export interface GuildRolemeEntry {
    readonly channels: readonly string[]; // channelids
    readonly casesensitive: boolean;
    readonly message: string;
    readonly add: readonly string[]; // roleids
    readonly remove: readonly string[]; // roleids
    readonly output?: GuildTriggerTag;
}

export interface MutableGuildRolemes extends GuildRolemes {
    [id: string]: GuildRolemeEntry | undefined;
}

export interface GuildWarnings {
    readonly users?: { readonly [userId: string]: number | undefined; };
}
export interface MutableGuildWarnings {
    users?: { [userId: string]: number | undefined; };
}

export interface GuildCensors {
    readonly list?: { readonly [censorId: string]: GuildCensor | undefined; };
    readonly exception?: GuildCensorExceptions;
    readonly rule?: GuildCensorRule;
}

export interface MutableGuildCensors extends GuildCensors {
    list?: { [censorId: string]: MutableGuildCensor | undefined; };
    exception?: MutableGuildCensorExceptions;
    rule?: MutableGuildCensorRule;
}

export interface GuildCensorRule {
    readonly deleteMessage?: GuildTriggerTag;
    readonly banMessage?: GuildTriggerTag;
    readonly kickMessage?: GuildTriggerTag;
}

export interface MutableGuildCensorRule extends GuildCensorRule {
    deleteMessage?: GuildTriggerTag;
    banMessage?: GuildTriggerTag;
    kickMessage?: GuildTriggerTag;
}

export interface GuildCensor extends GuildCensorRule, MessageFilter {
    readonly weight: number;
    readonly reason?: string;
}

export interface MutableGuildCensor extends MutableGuildCensorRule, MessageFilter {
    weight: number;
    reason?: string;
}

export interface GuildCensorExceptions {
    readonly channel?: readonly string[]; // channelids
    readonly user?: readonly string[]; // userids
    readonly role?: readonly string[]; // roleids
}

export interface MutableGuildCensorExceptions extends GuildCensorExceptions {
    channel?: string[]; // channelids
    user?: string[]; // userids
    role?: string[]; // roleids
}

export interface GuildTagBase {
    readonly author: string;
    readonly authorizer?: string;
}

export interface GuildCommandTagBase extends GuildTagBase, CommandPermissions {
    readonly help?: string;
    readonly cooldown?: number;
}

export interface GuildSourceCommandTag extends GuildCommandTagBase {
    readonly flags?: readonly FlagDefinition[];
    readonly content: string;
}

export interface NamedGuildSourceCommandTag extends GuildSourceCommandTag {
    readonly name: string;
}

export interface GuildImportedCommandTag extends GuildCommandTagBase {
    readonly alias: string;
}

export interface NamedGuildImportedCommandTag extends GuildImportedCommandTag {
    readonly name: string;
}

export interface GuildTriggerTag extends GuildTagBase {
    readonly content: string;
}

export type GuildCommandTag = GuildImportedCommandTag | GuildSourceCommandTag;
export type NamedGuildCommandTag = NamedGuildImportedCommandTag | NamedGuildSourceCommandTag;

export interface CommandPermissions {
    readonly disabled?: boolean;
    readonly permission?: string;
    /** Role ids, names or mentions */
    readonly roles?: readonly string[];
    readonly hidden?: boolean;
}

export interface MutableCommandPermissions extends CommandPermissions {
    disabled?: boolean;
    permission?: string;
    /** Role ids, names or mentions */
    roles?: string[];
    hidden?: boolean;
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
    readonly actonlimitsonly?: boolean;
    readonly adminrole?: string; // role tag or role name
    readonly antimention?: number;
    readonly banat?: number;
    readonly banoverride?: string;
    readonly cahnsfw?: boolean;
    readonly deletenotif?: boolean;
    readonly disableeveryone?: boolean;
    readonly disablenoperms?: boolean;
    readonly dmhelp?: boolean;
    readonly farewellchan?: string; // channelid
    readonly greetChan?: string; // channelid
    readonly kickat?: number;
    readonly kickoverride?: string;
    readonly makelogs?: boolean;
    readonly modlog?: string; // channelid or channel tag
    readonly mutedrole?: string; // roleid or role tag
    readonly nocleverbot?: boolean;
    readonly prefix?: readonly string[];
    readonly social?: boolean;
    readonly staffperms?: string;
    readonly tableflip?: boolean;
}

export interface MutableStoredGuildSettings extends Mutable<StoredGuildSettings> {
    prefix?: string[];
}

export interface GuildModlogEntry {
    readonly caseid: number;
    readonly modid?: string;
    readonly msgid?: string;
    readonly channelid?: string;
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

export interface MutableStoredUser extends Omit<StoredUser, keyof MutableStoredUserSettings>, MutableStoredUserSettings {
    usernames: StoredUsername[];
    username?: string;
    discriminator?: string;
    avatarURL?: string;
    reports?: { [key: string]: string | undefined; };
    todo: UserTodo[];
}

export interface StoredUserSettings {
    readonly dontdmerrors?: boolean;
    readonly prefixes?: readonly string[];
    readonly blacklisted?: string;
    readonly timezone?: string;
}

export interface MutableStoredUserSettings extends Mutable<StoredUserSettings> {
    prefixes?: string[];
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
    readonly embeds: Embed[];
}

export interface Chatlog extends ChatlogMessage {
    readonly id: Snowflake;
    readonly msgtime: Date;
    readonly type: ChatlogType;
}

export interface ChatlogIndex<T = string> {
    readonly keycode: string;
    readonly channel: string;
    readonly users: readonly string[];
    readonly types: readonly ChatlogType[];
    readonly ids: readonly T[];
    readonly limit: number;
}

export interface ChatlogSearchOptions {
    readonly channelId: string;
    readonly types: readonly ChatlogType[];
    readonly users: readonly string[];
    readonly exclude: readonly string[];
    readonly count: number;
}

export interface BBTagVariable {
    readonly name: string;
    readonly type: SubtagVariableType;
    readonly scope: string;
    content: string;
}

export interface DatabaseOptions {
    readonly logger: Logger;
    readonly discord: Discord;
    readonly rethink: RethinkConfiguration;
    readonly cassandra: CassandraConfiguration;
    readonly postgres: PostgresConfiguration;
    readonly airtable: AirtableConfiguration;
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
    getRoleme(guildId: string, id: number, skipCache?: boolean): Promise<GuildRolemeEntry | undefined>;
    setRoleme(guildId: string, id: number, roleme: GuildRolemeEntry | undefined): Promise<boolean>;
    updateModlogCase(guildId: string, caseid: number, modlog: Partial<Omit<GuildModlogEntry, 'caseid'>>): Promise<boolean>;
    getModlogCase(guildId: string, caseId?: number, skipCache?: boolean): Promise<GuildModlogEntry | undefined>;
    removeModlogCases(guildId: string, ids?: readonly number[]): Promise<readonly GuildModlogEntry[] | undefined>;
    getInterval(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    setInterval(guildId: string, interval: GuildTriggerTag | undefined): Promise<boolean>;
    getFarewell(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    setFarewell(guildId: string, farewell: GuildTriggerTag | undefined): Promise<boolean>;
    getGreeting(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    setGreeting(guildId: string, greeting: GuildTriggerTag | undefined): Promise<boolean>;
    setAnnouncements(guildId: string, options: GuildAnnounceOptions | undefined): Promise<boolean>;
    getAnnouncements(guildId: string, skipCache?: boolean): Promise<GuildAnnounceOptions | undefined>;
    clearVoteBans(guildId: string, userId?: string): Promise<void>;
    getVoteBans(guildId: string, skipCache?: boolean): Promise<GuildVotebans | undefined>;
    getVoteBans(guildId: string, target: string, skipCache?: boolean): Promise<readonly string[] | undefined>;
    hasVoteBanned(guildId: string, target: string, signee: string, skipCache?: boolean): Promise<boolean>;
    addVoteBan(guildId: string, target: string, signee: string, reason?: string): Promise<number | false>;
    removeVoteBan(guildId: string, target: string, signee: string): Promise<number | false>;
    getAutoresponse(guildId: string, index: number, skipCache?: boolean): Promise<GuildFilteredAutoresponse | undefined>;
    getAutoresponse(guildId: string, index: 'everything', skipCache?: boolean): Promise<GuildAutoresponse | undefined>;
    getAutoresponse(guildId: string, index: number | 'everything', skipCache?: boolean): Promise<GuildAutoresponse | GuildFilteredAutoresponse | undefined>;
    getAutoresponses(guildId: string, skipCache?: boolean): Promise<GuildAutoresponses>;
    setAutoresponse(guildId: string, index: number, autoresponse: GuildFilteredAutoresponse | undefined): Promise<boolean>;
    setAutoresponse(guildId: string, index: 'everything', autoresponse: GuildAutoresponse | undefined): Promise<boolean>;
    setAutoresponse(guildId: string, index: number | 'everything', autoresponse: undefined): Promise<boolean>;
    getChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, skipCache?: boolean): Promise<ChannelSettings[K] | undefined>;
    setChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, value: ChannelSettings[K]): Promise<boolean>;
    getRolemes(guildId: string, skipCache?: boolean): Promise<{ readonly [id: string]: GuildRolemeEntry | undefined; } | undefined>;
    getCensors(guildId: string, skipCache?: boolean): Promise<GuildCensors | undefined>;
    getCensor(guildId: string, id: number, skipCache?: boolean): Promise<GuildCensor | undefined>;
    setCensor(guildId: string, id: number, censor: GuildCensor | undefined): Promise<boolean>;
    censorIgnoreUser(guildId: string, userId: string, ignored: boolean): Promise<boolean>;
    censorIgnoreChannel(guildId: string, channelId: string, ignored: boolean): Promise<boolean>;
    censorIgnoreRole(guildId: string, roleId: string, ignored: boolean): Promise<boolean>;
    setCensorRule(guildId: string, id: number | undefined, ruleType: 'kick' | 'ban' | 'delete', code: GuildTriggerTag | undefined): Promise<boolean>;
    getCensorRule(guildId: string, id: number | undefined, ruleType: 'kick' | 'ban' | 'delete', skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    getCustomCommands(guildId: string, skipCache?: boolean): Promise<readonly NamedGuildCommandTag[]>;
    getCustomCommandNames(guildId: string, skipCache?: boolean): Promise<readonly string[]>;
    get(guildId: string, skipCache?: boolean): Promise<StoredGuild | undefined>;
    upsert(guild: Guild): Promise<'inserted' | 'updated' | false>;
    exists(guildId: string, skipCache?: boolean): Promise<boolean>;
    isActive(guildId: string, skipCache?: boolean): Promise<boolean>;
    setActive(guildId: string, active?: boolean): Promise<boolean>;
    getIds(skipCache?: boolean): Promise<readonly string[]>;
    getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache?: boolean): Promise<StoredGuildSettings[K] | undefined>;
    setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean>;
    getCommand(guildId: string, commandName: string, skipCache?: boolean): Promise<NamedGuildCommandTag | undefined>;
    getIntervals(skipCache?: boolean): Promise<ReadonlyArray<{ readonly guildId: string; readonly interval: GuildTriggerTag; }>>;
    updateCommand(guildId: string, commandName: string, command: Partial<GuildCommandTag>): Promise<boolean>;
    updateCommands(guildId: string, commandNames: string[], command: Partial<GuildCommandTag>): Promise<readonly string[]>;
    setCommand(guildId: string, commandName: string, command: GuildCommandTag | undefined): Promise<boolean>;
    setCommandProp<K extends keyof GuildSourceCommandTag>(guildId: string, commandName: string, key: K, value: GuildSourceCommandTag[K]): Promise<boolean>;
    setCommandProp<K extends keyof GuildImportedCommandTag>(guildId: string, commandName: string, key: K, value: GuildImportedCommandTag[K]): Promise<boolean>;
    setCommandProp<K extends keyof GuildCommandTag>(guildId: string, commandName: string, key: K, value: GuildCommandTag[K]): Promise<boolean>;
    renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean>;
    getNewModlogCaseId(guildId: string, skipCache?: boolean): Promise<number | undefined>;
    addModlogCase(guildId: string, modlog: GuildModlogEntry): Promise<boolean>;
    getLogIgnores(guildId: string, skipCache?: boolean): Promise<ReadonlySet<string>>;
    getLogChannel(guildId: string, type: StoredGuildEventLogType, skipCache?: boolean): Promise<string | undefined>;
    getLogChannels(guildId: string, skipCache?: boolean): Promise<StoredGuildEventLogConfig>;
    setLogChannel(guildId: string, event: StoredGuildEventLogType, channel: string | undefined): Promise<boolean>;
    setLogChannel(guildId: string, events: StoredGuildEventLogType[], channel: string | undefined): Promise<boolean>;
    setLogIgnores(guildId: string, userIds: readonly string[], ignore: boolean): Promise<boolean>;
    getWarnings(guildId: string, userId: string, skipCache?: boolean): Promise<number | undefined>;
    setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean>;
    getCommandPerms(guildId: string, skipCache?: boolean): Promise<Readonly<Record<string, CommandPermissions>> | undefined>;
    getCommandPerms(guildId: string, commandName: string, skipCache?: boolean): Promise<CommandPermissions | undefined>;
    setCommandPerms(guildId: string, commands: string[], permissions: Partial<CommandPermissions>): Promise<readonly string[]>;
}

export interface UserTable {
    getTodo(userId: string, skipCache?: boolean): Promise<readonly string[] | undefined>;
    addTodo(userId: string, item: string): Promise<boolean>;
    removeTodo(userId: string, index: number): Promise<boolean>;
    addPrefix(userId: string, prefix: string): Promise<boolean>;
    removePrefix(userId: string, prefix: string): Promise<boolean>;
    removeUsernames(userId: string, usernames: readonly string[] | 'all'): Promise<boolean>;
    getUsernames(userId: string, skipCache?: boolean): Promise<readonly StoredUsername[] | undefined>;
    setSetting<K extends keyof StoredUserSettings>(userId: string, key: K, value: StoredUserSettings[K]): Promise<boolean>;
    getSetting<K extends keyof StoredUserSettings>(userId: string, key: K, skipCache?: boolean): Promise<StoredUserSettings[K] | undefined>;
    get(userId: string, skipCache?: boolean): Promise<StoredUser | undefined>;
    upsert(user: User): Promise<'inserted' | 'updated' | false>;
    setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean>;
}

export interface VarsTable {
    set<K extends KnownStoredVars['varname']>(name: K, value: GetStoredVar<K> | undefined): Promise<boolean>;
    get<K extends KnownStoredVars['varname']>(key: K): Promise<GetStoredVar<K> | undefined>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<boolean>;
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
    update(tagName: string, tag: Partial<StoredTag>): Promise<boolean>;
    setProp<K extends keyof StoredTag>(tagName: string, key: K, value: StoredTag[K]): Promise<boolean>;
    add(tag: StoredTag): Promise<boolean>;
    incrementUses(tagName: string, count?: number): Promise<boolean>;
    incrementReports(tagName: string, count?: number): Promise<boolean>;
    getFavourites(userId: string): Promise<readonly string[]>;
    setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean>;
}

export interface ChatlogsTable {
    add(message: ChatlogMessage, type: ChatlogType, lifespan?: number | Duration): Promise<void>;
    getByMessageId(messageId: string): Promise<Chatlog | undefined>;
    findAll(options: ChatlogSearchOptions): Promise<readonly Chatlog[]>;
    getAll(channelId: string, ids: readonly string[]): Promise<readonly Chatlog[]>;
}

export interface ChatlogIndexTable {
    add(index: ChatlogIndex): Promise<boolean>;
    get(id: string): Promise<ChatlogIndex | undefined>;
}

export interface DumpsTable {
    add(dump: Dump, lifespan?: number | Duration): Promise<void>;
}

export interface TagVariablesTable {
    upsert(values: Record<string, JToken | undefined>, type: SubtagVariableType, scope: string): Promise<void>;
    get(name: string, type: SubtagVariableType, scope: string): Promise<JToken | undefined>;
}

export interface SuggestorsTable {
    get(id: string): Promise<Suggestor | undefined>;
    upsert(userid: string, username: string): Promise<string | undefined>;
}

export interface SuggestionsTable {
    get(id: number): Promise<Suggestion | undefined>;
    create(suggestion: Suggestion): Promise<number | undefined>;
    update(id: number, suggestion: Partial<Suggestion>): Promise<boolean>;
}

export type TypeMappingResult<T> = { readonly valid: false; } | { readonly valid: true; readonly value: T; };
export type NormalizedTypeMapping<T, TUnion, TArgs extends unknown[] = []> = TypeMapping<Exclude<T, undefined | null> | TUnion, TArgs>;
export type TypeMappingImpl<T, TArgs extends unknown[] = []> = (value: unknown, ...args: TArgs) => TypeMappingResult<T>;

export interface TypeMapping<T, TArgs extends unknown[] = []> extends TypeMappingImpl<T, TArgs> {
    readonly required: NormalizedTypeMapping<T, never, TArgs>;
    readonly optional: NormalizedTypeMapping<T, undefined, TArgs>;
    readonly nullable: NormalizedTypeMapping<T, null, TArgs>;
    readonly nullish: NormalizedTypeMapping<T, null | undefined, TArgs>;
    map<R>(mapping: (value: T) => R): TypeMapping<R, TArgs>;
}

export type TypeMappings<T, TArgs extends unknown[] = []> = {
    readonly [P in keyof T]-?:
    | TypeMappingImpl<T[P], TArgs>
    | [PropertyKey, TypeMappingImpl<T[P], TArgs>]
    | [T[P]]
};

export interface IMiddleware<Context, Result = void> {
    readonly name?: string;
    readonly execute: (context: Context, next: NextMiddleware<Result>) => Awaitable<Result>;
}

export interface NextMiddleware<Result> extends MiddlewareOptions {
    (): Awaitable<Result>;
}

export interface MiddlewareOptions {
    readonly id: Snowflake;
    readonly logger: Logger;
    readonly start: number;
}
export enum SubtagVariableType {
    LOCAL = 'LOCAL_TAG',
    AUTHOR = 'AUTHOR',
    GUILD = 'GUILD_CC',
    GLOBAL = 'GLOBAL',
    TAGGUILD = 'GUILD_TAG',
    GUILDLOCAL = 'LOCAL_CC'
}
