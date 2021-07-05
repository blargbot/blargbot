import { AnyMessage, Attachment, Embed, EmbedOptions, GuildChannel, Member, MessageFile, PrivateChannel, Shard, Textable, User } from 'eris';
import ReadWriteLock from 'rwlock';
import { StoredGuildCommand, StoredTag, CommandType, CommandContext, SendPayload, NamedStoredRawGuildCommand, GuildAutoresponse, GuildFilteredAutoresponse, SubtagType, StoredGuild, StoredGuildSettings, SubtagVariableType, ModerationType } from '.';
import { ClusterWorker } from '../ClusterWorker';
import { BBTagContext, limits, ScopeCollection, TagCooldownManager, VariableCache } from './bbtag';

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
        attachments: Attachment[];
        embeds: Embed[];
    };
    isCC: boolean;
    state: Omit<BBTagContextState, 'cache' | 'overrides'>;
    scope: BBTagRuntimeScope;
    input: readonly string[];
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
    timestamp: number;
    content: string;
    channel: GuildChannel & Textable;
    member: Member;
    author: User;
    attachments: Attachment[];
    embeds: Embed[];
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
    embed: undefined | EmbedOptions;
    file: undefined | MessageFile;
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
    readonly input: readonly string[];
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

export type FlagDefinition = {
    readonly flag: string;
    readonly word: string;
    readonly desc: string;
};

export interface FlagResult {
    readonly undefined: readonly string[];
    readonly [flag: string]: readonly string[] | undefined;
}

export interface MutableFlagResult extends FlagResult {
    readonly undefined: string[];
    [flag: string]: string[] | undefined;
}

export interface CommandOptionsBase {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: CommandType;
    readonly cannotDisable?: boolean;
    readonly info?: string;
    readonly flags?: readonly FlagDefinition[];
    readonly onlyOn?: string | undefined;
    readonly cooldown?: number;
}

export interface CommandOptions<TContext extends CommandContext> extends CommandOptionsBase {
    readonly definition: CommandDefinition<TContext>;
}

export type CommandResult =
    | SendPayload
    | MessageFile
    | MessageFile[]
    | { readonly content: SendPayload; readonly files: MessageFile | MessageFile[]; }
    | string
    | void;

export type CommandDefinition<TContext extends CommandContext> =
    | CommandHandlerDefinition<TContext>
    | SubcommandDefinitionHolder<TContext>
    | CommandHandlerDefinition<TContext> & SubcommandDefinitionHolder<TContext>;

export type CommandParameter =
    | CommandVariableParameter
    | CommandLiteralParameter;

export interface CommandHandlerDefinition<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly execute: (context: TContext, args: readonly any[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
    readonly allowOverflow?: boolean;
    readonly dontBind?: boolean;
    readonly useFlags?: boolean;
    readonly strictFlags?: boolean;

}

export interface SubcommandDefinitionHolder<TContext extends CommandContext> {
    readonly subcommands: { readonly [name: string]: CommandDefinition<TContext>; };
}

export interface CommandVariableParameter {
    readonly type: 'variable';
    readonly name: string;
    readonly valueType: string;
    readonly required: boolean;
    readonly rest: boolean;
    readonly display: string;
    readonly parse: (value: string) => unknown;
}

export interface CommandLiteralParameter {
    readonly type: 'literal';
    readonly name: string;
    readonly alias: string[];
    readonly required: boolean;
    readonly display: string;
    readonly parse: (value: string) => unknown;
}

export interface CommandHandler<TContext extends CommandContext> {
    readonly signatures: ReadonlyArray<readonly CommandParameter[]>;
    readonly execute: (context: TContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSignatureHandler<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters: readonly CommandParameter[];
    readonly execute: (context: TContext, args: readonly string[]) => Promise<CommandResult> | CommandResult;
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
    readonly usage: string;
    readonly info: string;
    readonly category: CommandType;
    readonly aliases: readonly string[];
    readonly flags: readonly FlagDefinition[];
    readonly onlyOn: string | undefined;
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
    readonly status: Shard['status'];
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
    prompt: AnyMessage | undefined;
    response: Promise<AnyMessage | undefined>;
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

export type GuildCommandContext<TChannel extends GuildChannel = GuildChannel> = CommandContext<TChannel> & { message: { member: Member; guildID: string; }; };
export type PrivateCommandContext<TChannel extends PrivateChannel = PrivateChannel> = CommandContext<TChannel>;

export type CommandPropertiesSet = { [key in CommandType]: CommandProperties; }
export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly perm?: string;
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
export type MuteResult = 'success' | 'alreadyMuted' | 'noPerms' | 'roleMissing' | 'roleTooHigh';
export type UnmuteResult = 'success' | 'notMuted' | 'noPerms' | 'roleTooHigh';
export type BanResult = 'success' | 'noPerms' | 'moderatorNoPerms' | 'memberTooHigh';
export type KickResult = 'success' | 'noPerms' | 'moderatorNoPerms' | 'memberTooHigh';
export type UnbanResult = 'success' | 'noPerms';

export type WarnResult = {
    type: ModerationType.BAN;
    count: number;
    result: BanResult;
} | {
    type: ModerationType.KICK;
    count: number;
    result: KickResult;
} | {
    type: ModerationType.WARN;
    count: number;
    result: 'success';
}
