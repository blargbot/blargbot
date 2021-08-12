import { BBTagContext, limits, ScopeCollection, TagCooldownManager, VariableCache } from '@cluster/bbtag';
import { CommandContext, CommandVariableType, ScopedCommandBase } from '@cluster/command';
import { CommandType, ModerationType, SubtagType, SubtagVariableType } from '@cluster/utils';
import { GuildAutoresponse, GuildFilteredAutoresponse, NamedStoredRawGuildCommand, SendPayload, StoredGuild, StoredGuildCommand, StoredGuildSettings, StoredTag } from '@core/types';
import { AllChannels, Collection, ConstantsStatus, FileOptions, GuildMember, GuildTextBasedChannels, Message, MessageAttachment, MessageEmbed, MessageEmbedOptions, PermissionString, PrivateTextBasedChannels, Role, User } from 'discord.js';
import ReadWriteLock from 'rwlock';

import { ClusterWorker } from './ClusterWorker';

export type Statement = Array<string | SubtagCall>;

export interface AnalysisResults {
    errors: AnalysisResult[];
    warnings: AnalysisResult[];
}

export interface AnalysisResult {
    location: SourceMarker;
    message: string;
}

export interface SubtagCall {
    name: Statement;
    args: Statement[];
    start: SourceMarker;
    end: SourceMarker;
    source: string;
}

export const enum SourceTokenType {
    CONTENT,
    STARTSUBTAG,
    ENDSUBTAG,
    ARGUMENTDELIMITER
}

export interface SourceMarker {
    index: number;
    line: number;
    column: number;
}
export type BBTagArray = { n?: string; v: JArray; };

export interface SourceToken {
    type: SourceTokenType;
    content: string;
    start: SourceMarker;
    end: SourceMarker;
}
export interface BBTagRuntimeScope {
    quiet?: boolean;
    fallback?: string;
    suppressLookup?: boolean;
    reason?: string;
}
export interface SerializedRuntimeLimit {
    type: keyof typeof limits;
    rules: { [key: string]: JToken[]; };
}

export interface SerializedBBTagContext {
    msg: {
        id: string;
        timestamp: number;
        content: string;
        channel: { id: string; serialized: string; };
        member: { id: string; serialized: string; };
        attachments: Array<{
            id: string;
            name: string;
            url: string;
        }>;
        embeds: MessageEmbedOptions[];
    };
    isCC: boolean;
    state: Omit<BBTagContextState, 'cache' | 'overrides'>;
    scope: BBTagRuntimeScope;
    inputRaw: string;
    flaggedInput: FlagResult;
    tagName: string;
    author: string;
    authorizer: string;
    tagVars: boolean;
    tempVars: Record<string, JToken>;
    limit: SerializedRuntimeLimit;
}

export interface BBTagContextMessage {
    id: string;
    createdTimestamp: number;
    content: string;
    channel: GuildTextBasedChannels;
    member: GuildMember;
    author: User;
    attachments: Collection<Snowflake, MessageAttachment>;
    embeds: MessageEmbed[];
}

export interface BBTagContextState {
    query: {
        count: number;
        user: Record<string, string | undefined>;
        role: Record<string, string | undefined>;
        channel: Record<string, string | undefined>;
    };
    outputMessage: Promise<string | undefined> | undefined;
    ownedMsgs: string[];
    return: RuntimeReturnState;
    stackSize: number;
    embed: undefined | MessageEmbedOptions;
    file: undefined | FileOptions;
    reactions: string[];
    nsfw: undefined | string;
    replace: undefined | { regex: RegExp | string; with: string; };
    break: number;
    continue: number;
    subtags: Record<string, number[] | undefined>;
    overrides: Record<string, SubtagHandler | undefined>;
    cache: Record<string, StoredGuildCommand | StoredTag>;
    subtagCount: number;
    allowedMentions: {
        users: string[];
        roles: string[];
        everybody: boolean;
    };

}

export interface RuntimeError {
    readonly subtag: SubtagCall | undefined;
    readonly error: string | readonly RuntimeError[];
    readonly debugMessage: string | undefined;
}

export interface RuntimeDebugEntry {
    subtag: SubtagCall;
    text: string;
}

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly scopeName: string;
    check(context: BBTagContext, subtag: SubtagCall, subtagName: string): Promise<string | undefined> | string | undefined;
    rulesFor(subtagName: string): string[];
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}

export const enum RuntimeReturnState {
    NONE = 0,
    CURRENTTAG = 1,
    ALL = -1
}

export interface BBTagContextOptions {
    readonly message: BBTagContextMessage;
    readonly inputRaw: string;
    readonly flags?: readonly FlagDefinition[];
    readonly isCC: boolean;
    readonly tagVars?: boolean;
    readonly author: string;
    readonly authorizer?: string;
    readonly tagName?: string;
    readonly cooldown?: number;
    readonly cooldowns?: TagCooldownManager;
    readonly locks?: Record<string, ReadWriteLock | undefined>;
    readonly limit: RuntimeLimit;
    readonly silent?: boolean;
    readonly state?: Partial<BBTagContextState>;
    readonly scopes?: ScopeCollection;
    readonly variables?: VariableCache;
}

export interface ExecutionResult {
    content: string;
    errors: RuntimeError[];
    debug: RuntimeDebugEntry[];
    duration: {
        total: number;
        database: number;
        active: number;
        subtag: Record<string, number[] | undefined>;
    };
    database: {
        committed: number;
        values: Record<string, JToken>;
    };
}
export type SubtagResult =
    | string
    | undefined
    | void;

export interface SubtagHandlerCallSignature extends SubtagSignatureDetails {
    readonly execute: (this: unknown, context: BBTagContext, args: SubtagArgumentValueArray, subtagCall: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

export interface SubtagHandler {
    readonly execute: (this: unknown, context: BBTagContext, subtagName: string, call: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

export interface SubtagHandlerParameter {
    readonly name: string | undefined;
    readonly required: boolean;
    readonly greedy: number | false;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly nested: readonly SubtagHandlerParameter[];
}

export interface SubtagSignatureDetails<TArgs = SubtagHandlerParameter> {
    readonly parameters: readonly TArgs[];
    readonly description?: string;
    readonly exampleCode?: string;
    readonly exampleIn?: string;
    readonly exampleOut?: string;
}

export interface SubtagHandlerDefinition extends SubtagSignatureDetails<string | SubtagHandlerDefinitionParameterGroup> {
    readonly execute: (this: unknown, context: BBTagContext, args: SubtagArgumentValueArray, subtagCall: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

export interface SubtagHandlerDefinitionParameterGroup {
    readonly name?: string;
    readonly type?: 'optional' | 'required' | `${number}OrMore`;
    readonly parameters: ReadonlyArray<string | SubtagHandlerDefinitionParameterGroup>;
}

export interface FlagDefinition {
    readonly flag: Letter;
    readonly word: string;
    readonly description: string;
}

export interface FlagResultValue {
    get value(): string;
    get raw(): string;
}

export interface FlagResultValueSet {
    merge(): FlagResultValue;
    merge(start: number, end?: number): FlagResultValue;
    length: number;
    get(index: number): FlagResultValue | undefined;
    slice(start: number, end?: number): FlagResultValueSet;
}

export type FlagResultBase = { readonly [P in Letter | '_']?: FlagResultValueSet }
export interface FlagResult extends FlagResultBase {
    readonly _: FlagResultValueSet;
}

export interface CommandOptionsBase {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: CommandType;
    readonly cannotDisable?: boolean;
    readonly description?: string;
    readonly flags?: readonly FlagDefinition[];
    readonly onlyOn?: string | undefined;
}

export interface CommandBaseOptions extends CommandOptionsBase {
    readonly signatures: readonly CommandSignature[];
}

export interface CommandOptions<TContext extends CommandContext> extends CommandOptionsBase {
    readonly definitions: ReadonlyArray<CommandDefinition<TContext>>;
}

export type CommandResult =
    | SendPayload
    | FileOptions
    | FileOptions[]
    | string
    | undefined
    | void;

export type CommandDefinition<TContext extends CommandContext> =
    | CommandHandlerDefinition<TContext>
    | SubcommandDefinitionHolder<TContext>
    | CommandHandlerDefinition<TContext> & SubcommandDefinitionHolder<TContext>;

export type CommandParameter =
    | CommandSingleParameter
    | CommandConcatParameter
    | CommandGreedyParameter
    | CommandLiteralParameter;

export interface CommandHandlerDefinition<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters: string;
    readonly hidden?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly execute: (context: TContext, args: readonly any[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
}

export interface SubcommandDefinitionHolder<TContext extends CommandContext> {
    readonly parameters: string;
    readonly hidden?: boolean;
    readonly subcommands: ReadonlyArray<CommandDefinition<TContext>>;
}

export interface CommandSingleParameter<T extends string = 'singleVar'> {
    readonly kind: T;
    readonly name: string;
    readonly raw: boolean;
    readonly type: CommandVariableType;
    readonly required: boolean;
    readonly fallback: undefined | string;
}

export interface CommandGreedyParameter {
    readonly kind: 'greedyVar';
    readonly name: string;
    readonly raw: boolean;
    readonly type: CommandVariableType;
    readonly minLength: number;
}

export type CommandConcatParameter = CommandSingleParameter<'concatVar'>

export interface CommandLiteralParameter {
    readonly kind: 'literal';
    readonly name: string;
    readonly alias: string[];
}

export interface CommandHandler<TContext extends CommandContext> {
    get debugView(): string;
    readonly execute: (context: TContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSignature {
    readonly description: string;
    readonly parameters: readonly CommandParameter[];
    readonly hidden: boolean;
}

export interface CommandSignatureHandler<TContext extends CommandContext> extends CommandSignature {
    readonly execute: (context: TContext, args: readonly unknown[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
}

export type CustomCommandShrinkwrap = {
    readonly [P in Exclude<keyof NamedStoredRawGuildCommand, 'author' | 'authorizer' | 'name'>]: NamedStoredRawGuildCommand[P]
}

export interface AutoresponseShrinkwrap extends Omit<GuildAutoresponse, 'executes'> {
    readonly executes: CustomCommandShrinkwrap;
}

export interface FilteredAutoresponseShrinkwrap extends AutoresponseShrinkwrap, Omit<GuildFilteredAutoresponse, 'executes'> {
    readonly executes: CustomCommandShrinkwrap;
}

export interface GuildShrinkwrap {
    readonly cc: Record<string, CustomCommandShrinkwrap>;
    readonly ar: FilteredAutoresponseShrinkwrap[];
    are: null | AutoresponseShrinkwrap;
}

export interface SignedGuildShrinkwrap {
    readonly signature?: string;
    readonly payload: GuildShrinkwrap;
}

export interface LookupChannelResult {
    channel: string;
    guild: string;
}

export interface GetStaffGuildsRequest {
    user: string;
    guilds: string[];
}

export interface ClusterRespawnRequest {
    id?: number;
    channel: string;
}

export interface SubtagListResult {
    [tagName: string]: SubtagDetails | undefined;
}

export interface SubtagDetails {
    readonly category: SubtagType;
    readonly name: string;
    readonly signatures: readonly SubtagSignatureDetails[];
    readonly deprecated: boolean | string;
    readonly staff: boolean;
    readonly aliases: readonly string[];
}

export interface CommandListResult {
    [commandName: string]: CommandDetails | undefined;
}

export interface SubtagArgumentValue {
    readonly isCached: boolean;
    readonly value: string;
    readonly code: Statement;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}

export interface SubtagArgumentValueArray extends ReadonlyArray<SubtagArgumentValue> {
    readonly subtagName: string;
}

export interface CommandDetails {
    readonly name: string;
    readonly info: string;
    readonly category: CommandType;
    readonly aliases: readonly string[];
    readonly flags: readonly FlagDefinition[];
    readonly onlyOn: string | undefined;
    readonly signatures: readonly CommandSignature[];
}

export type SubHandler = (context: BBTagContext, subtagName: string, call: SubtagCall) => Promise<SubtagResult>;
export type ArgumentResolver = (context: BBTagContext, args: readonly Statement[]) => AsyncGenerator<SubtagArgumentValue>;

export interface SubHandlerCollection {
    byNumber: { [argLength: number]: SubHandler | undefined; };
    byTest: Array<{
        execute: SubHandler;
        test: (argCount: number) => boolean;
    }>;
}

export interface ArgumentResolvers {
    byNumber: { [argLength: number]: ArgumentResolver; };
    byTest: Array<{
        resolver: ArgumentResolver;
        test: (argCount: number) => boolean; minArgCount: number; maxArgCount: number;
    }>;
}

export interface ArgumentResolverPermutations {
    greedy: SubtagHandlerParameter[];
    permutations: Array<{
        beforeGreedy: SubtagHandlerParameter[];
        afterGreedy: SubtagHandlerParameter[];
    }>;
}
export interface ClusterStats {
    readonly id: number;
    readonly time: number;
    readonly readyTime: number;
    readonly guilds: number;
    readonly rss: number;
    readonly userCpu: number;
    readonly systemCpu: number;
    readonly shardCount: number;
    readonly shards: readonly ShardStats[];
}

export interface ShardStats {
    readonly id: number;
    readonly status: keyof ConstantsStatus;
    readonly latency: number;
    readonly guilds: number;
    readonly cluster: number;
    readonly time: number;
}
export interface ClusterOptions {
    id: number;
    worker: ClusterWorker;
    shardCount: number;
    firstShardId: number;
    lastShardId: number;
}

export interface ClusterPoolOptions {
    worker?: string;
}

export interface FindEntityOptions {
    quiet?: boolean;
    suppress?: boolean;
    onSendCallback?: () => void;
    label?: string;
}

export interface CanExecuteDefaultCommandOptions {
    readonly quiet?: boolean;
    readonly storedGuild?: StoredGuild;
    readonly permOverride?: StoredGuildSettings['permoverride'];
    readonly staffPerms?: StoredGuildSettings['staffperms'];
}

export interface CanExecuteCustomCommandOptions {
    readonly quiet?: boolean;
}

export interface LookupMatch<T> {
    content: string;
    value: T;
}

export interface MessagePrompt {
    prompt: Message | undefined;
    response: Promise<Message | undefined>;
}

export interface BanDetails {
    mod: User;
    reason: string;
}

export interface MassBanDetails {
    mod: User;
    type: string;
    users: User[];
    newUsers: User[];
    reason: string;
}

export interface SubtagOptions {
    name: string;
    aliases?: readonly string[];
    category: SubtagType;
    desc?: string;
    deprecated?: string | boolean;
    staff?: boolean;
}

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtag: SubtagCall): Promise<boolean> | boolean;
    errorText(subtagName: string, scopeName: string): string;
    displayText(subtagName: string, scopeName: string): string;
    state(): JToken;
    load(state: JToken): void;
}

export type GuildCommandContext<TChannel extends GuildTextBasedChannels = GuildTextBasedChannels> = CommandContext<TChannel> & { message: { member: GuildMember; guildID: string; }; };
export type PrivateCommandContext<TChannel extends PrivateTextBasedChannels = PrivateTextBasedChannels> = CommandContext<TChannel>;

export type CommandPropertiesSet = { [key in CommandType]: CommandProperties; }
export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly defaultPerms?: readonly PermissionString[];
    readonly requirement: (context: CommandContext) => boolean | Promise<boolean>;
    readonly color: number;
}

export type GuildSettingTypeName<T> =
    T extends string ? 'string' | 'channel' | 'role' :
    T extends number ? 'int' :
    T extends boolean ? 'bool' : never

export type GuildSettingDescriptor<T extends keyof StoredGuildSettings = keyof StoredGuildSettings> = {
    key: T;
    name: string;
    desc: string;
    type: GuildSettingTypeName<StoredGuildSettings[T]>;
}

export type SubtagPropertiesSet = { [key in SubtagType]: SubtagProperties; }
export interface SubtagProperties {
    name: string;
    desc: string;
}

export type SubtagVariablePropertiesSet = { [key in SubtagVariableType]: SubtagVariableProperties; }
export interface SubtagVariableProperties {
    table: string;
}

export type WhitelistResponse = 'approved' | 'rejected' | 'requested' | 'alreadyApproved' | 'alreadyRejected';

export type EnsureMutedRoleResult = 'success' | 'unconfigured' | 'noPerms';
export type MuteResult = 'success' | 'alreadyMuted' | 'noPerms' | 'roleMissing' | 'roleTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type UnmuteResult = 'success' | 'notMuted' | 'noPerms' | 'roleTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type BanResult = 'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type MassBanResult = User[] | Exclude<BanResult, 'success'> | 'noUsers';
export type KickResult = 'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type UnbanResult = 'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms';

export interface WarnDetails {
    readonly count: number;
    readonly banAt?: number;
    readonly kickAt?: number;
}

export interface WarnResultBase<ModType extends ModerationType, TResult extends string> {
    readonly type: ModType;
    readonly count: number;
    readonly state: TResult;
}

export type WarnResult =
    | WarnResultBase<ModerationType.BAN, BanResult>
    | WarnResultBase<ModerationType.KICK, KickResult>
    | WarnResultBase<ModerationType.WARN, 'success' | 'countNaN' | 'countNegative' | 'countZero'>;

export type CommandBinderParseResult<TResult> =
    | CommandBinderValue<TResult>
    | CommandBinderDeferred<TResult>

export type CommandBinderValue<TResult> =
    | CommandBinderSuccess<TResult>
    | CommandBinderFailure

export interface CommandBinderSuccess<TResult> {
    success: true;
    value: TResult;
}

export interface CommandBinderFailure {
    success: false;
    error: CommandResult;
}

export interface CommandBinderDeferred<TResult> {
    success: 'deferred';
    getValue(): CommandBinderValue<TResult> | Promise<CommandBinderValue<TResult>>;
}

export interface CommandBinderStateLookupCache {
    findUser(userString: string): CommandBinderParseResult<User>;
    findMember(memberString: string): CommandBinderParseResult<GuildMember>;
    findRole(roleString: string): CommandBinderParseResult<Role>;
    findChannel(channelString: string): CommandBinderParseResult<AllChannels>;
}

export interface CommandBinderState<TContext extends CommandContext> {
    readonly context: TContext;
    readonly command: ScopedCommandBase<TContext>;
    readonly arguments: ReadonlyArray<CommandBinderDeferred<unknown> | CommandBinderSuccess<unknown>>;
    readonly flags: FlagResult;
    readonly argIndex: number;
    readonly bindIndex: number;
    readonly result: CommandResult;
    readonly lookupCache: CommandBinderStateLookupCache;
}

export interface CommandMiddleware<TContext extends CommandContext> {
    execute(context: TContext, next: () => Promise<void>): Promise<void>;
}
