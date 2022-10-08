import { Subtag } from '@blargbot/bbtag';
import { Command, CommandContext, ScopedCommand } from '@blargbot/cluster/command';
import { CommandType, ModerationType } from '@blargbot/cluster/utils';
import { EvalRequest, EvalResult, FormatSendContent, GlobalEvalResult, IMiddleware, MasterEvalRequest, SendContent } from '@blargbot/core/types';
import { IFormattable } from '@blargbot/domain/messages/index';
import { CommandPermissions, FlagDefinition, FlagResult, GuildSettingDocs, GuildSourceCommandTag, NamedGuildCommandTag } from '@blargbot/domain/models';
import { Guild, KnownChannel, KnownGuildTextableChannel, KnownMessage, KnownPrivateChannel, KnownTextableChannel, Member, Role, Shard, User, Webhook } from 'eris';
import { Duration } from 'moment-timezone';
import { metric } from 'prom-client';

import { ClusterUtilities } from './ClusterUtilities';

export type ClusterIPCContract = {
    shardReady: { masterGets: number; workerGets: never; };
    meval: { masterGets: MasterEvalRequest; workerGets: GlobalEvalResult | EvalResult; };
    killshard: { masterGets: never; workerGets: number; };
    ceval: { masterGets: EvalResult; workerGets: EvalRequest; };
    getSubtagList: { masterGets: SubtagListResult; workerGets: undefined; };
    getSubtag: { masterGets: SubtagDetails | undefined; workerGets: string; };
    getGuildPermissionList: { masterGets: GuildPermissionDetails[]; workerGets: { userId: string; }; };
    getGuildPermission: { masterGets: GuildPermissionDetails | undefined; workerGets: { userId: string; guildId: string; }; };
    respawn: { masterGets: { id?: number; channel: string; }; workerGets: boolean; };
    respawnApi: { masterGets: undefined; workerGets: boolean; };
    respawnAll: { masterGets: { channelId: string; }; workerGets: boolean; };
    killAll: { masterGets: undefined; workerGets: undefined; };
    clusterStats: { masterGets: ClusterStats; workerGets: never; };
    getClusterStats: { masterGets: undefined; workerGets: Record<number, ClusterStats | undefined>; };
    getCommandList: { masterGets: CommandListResult; workerGets: undefined; };
    getGuildSettings: { masterGets: GuildSettingDocs; workerGets: undefined; };
    getCommand: { masterGets: ICommandDetails | undefined; workerGets: string; };
    metrics: { masterGets: metric[]; workerGets: undefined; };
}

export interface ICommandManager<T = unknown> {
    readonly size: number;
    get(name: string, location?: Guild | KnownTextableChannel, user?: User): Promise<CommandGetResult<T>>;
    list(location?: Guild | KnownTextableChannel, user?: User): AsyncIterable<CommandGetResult<T>>;
    configure(user: User, names: readonly string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;
    load(commands?: Iterable<string> | boolean): Promise<void>;
}

export interface ICommandDetails extends Required<CommandPermissions> {
    readonly name: string;
    readonly aliases: readonly string[];
    readonly category: string;
    readonly description: string | undefined;
    readonly flags: readonly FlagDefinition[];
    readonly signatures: readonly CommandSignature[];
}

export interface ICommand<T = unknown> extends ICommandDetails, IMiddleware<CommandContext, CommandResult> {
    readonly id: string;
    readonly name: string;
    readonly implementation: T;
    readonly isOnWebsite: boolean;
}

export type Result<State, Detail = undefined, Optional extends boolean = Detail extends undefined ? true : false> = Optional extends false
    ? { readonly state: State; readonly detail: Detail; }
    : { readonly state: State; readonly detail?: Detail; };

export type PermissionCheckResult =
    | Result<`ALLOWED`>
    | Result<`BLACKLISTED`, string>
    | Result<`DISABLED`>
    | Result<`NOT_IN_GUILD`>
    | Result<`MISSING_ROLE`, readonly string[]>
    | Result<`MISSING_PERMISSIONS`, bigint>;

export type CommandGetResult<T = unknown> =
    | Result<`NOT_FOUND`>
    | {
        [P in PermissionCheckResult[`state`]]: Extract<PermissionCheckResult, { state: P; }> extends Result<infer State, infer Detail>
        ? Result<State, { readonly command: ICommand<T>; readonly reason: Detail; }>
        : never
    }[PermissionCheckResult[`state`]]

export type CommandGetCoreResult<T = unknown> =
    | CommandGetResult<T>
    | Result<`FOUND`, ICommand<T>>;

export type CommandManagerTypeMap = {
    custom: NamedGuildCommandTag;
    default: Command;
};

export type CommandManagers = { [P in keyof CommandManagerTypeMap]: ICommandManager<CommandManagerTypeMap[P]> }

export interface CommandOptionsBase {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: CommandType;
    readonly cannotDisable?: boolean;
    readonly description?: IFormattable<string>;
    readonly flags?: readonly FlagDefinition[];
    readonly hidden?: boolean;
}

export interface CommandBaseOptions extends CommandOptionsBase {
    readonly signatures: readonly CommandSignature[];
}

export interface CommandOptions<TContext extends CommandContext> extends CommandOptionsBase {
    readonly definitions: ReadonlyArray<CommandDefinition<TContext>>;
}

export type CommandResult =
    | IFormattable<string | SendContent>
    | FormatSendContent<string | IFormattable<string>>
    | undefined;

export type CommandDefinition<TContext extends CommandContext> =
    | CommandHandlerDefinition<TContext>
    | SubcommandDefinitionHolder<TContext>
    | CommandHandlerDefinition<TContext> & SubcommandDefinitionHolder<TContext>;

export type CommandParameter =
    | CommandSingleParameter<keyof CommandVariableTypeMap, boolean>
    | CommandGreedyParameter<keyof CommandVariableTypeMap>
    | CommandLiteralParameter;

export interface CommandHandlerDefinition<TContext extends CommandContext> {
    readonly description: IFormattable<string>;
    readonly parameters: string;
    readonly hidden?: boolean;
    readonly execute: (context: TContext, args: readonly CommandArgument[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
}

export type CommandSingleArgument = {
    readonly [P in keyof CommandVariableTypeMap as `as${UppercaseFirst<P>}`]: CommandVariableTypeMap[P];
}

export type CommandOptionalArgument = {
    readonly [P in keyof CommandVariableTypeMap as `asOptional${UppercaseFirst<P>}`]: CommandVariableTypeMap[P] | undefined;
}

export type CommandArrayArgument = {
    readonly [P in keyof CommandVariableTypeMap as `as${UppercaseFirst<P>}s`]: ReadonlyArray<CommandVariableTypeMap[P]>;
}

export interface CommandArgument extends CommandSingleArgument, CommandArrayArgument, CommandOptionalArgument {
}

export interface SubcommandDefinitionHolder<TContext extends CommandContext> {
    readonly parameters: string;
    readonly hidden?: boolean;
    readonly subcommands: ReadonlyArray<CommandDefinition<TContext>>;
}

export type CommandVariableTypeMap = {
    literal: string;
    bigint: bigint;
    integer: number;
    number: number;
    role: Role;
    channel: KnownChannel;
    user: User;
    sender: User | Webhook;
    member: Member;
    duration: Duration;
    boolean: boolean;
    string: string;
}

export type CommandVariableTypeName = keyof CommandVariableTypeMap;

export type CommandVariableParser = <TContext extends CommandContext>(this: void, value: string, state: CommandBinderState<TContext>) => Awaitable<CommandBinderParseResult>

export interface CommandVariableTypeBase<Name extends CommandVariableTypeName> {
    readonly name: Name;
    readonly descriptionSingular?: string;
    readonly descriptionPlural?: string;
    readonly priority: number;
    parse: CommandVariableParser;
}

export interface LiteralCommandVariableType<T extends string> extends CommandVariableTypeBase<`literal`> {
    readonly choices: readonly T[];
}

export type UnmappedCommandVariableTypes = Exclude<CommandVariableTypeName, MappedCommandVariableTypes[`name`]>;
export type MappedCommandVariableTypes =
    | LiteralCommandVariableType<string>;

export type CommandVariableTypes =
    | MappedCommandVariableTypes
    | { [Name in UnmappedCommandVariableTypes]: CommandVariableTypeBase<Name> }[UnmappedCommandVariableTypes]

export type CommandVariableType<TName extends CommandVariableTypeName> = Extract<CommandVariableTypes, CommandVariableTypeBase<TName>>

export interface CommandSingleParameter<T extends CommandVariableTypeName, Concat extends boolean> {
    readonly kind: Concat extends false ? `singleVar` : `concatVar`;
    readonly name: string;
    readonly raw: boolean;
    readonly type: CommandVariableType<T>;
    readonly required: boolean;
    readonly fallback: undefined | string;
}

export interface CommandGreedyParameter<T extends CommandVariableTypeName> {
    readonly kind: `greedyVar`;
    readonly name: string;
    readonly raw: boolean;
    readonly type: CommandVariableType<T>;
    readonly minLength: number;
}

export interface CommandLiteralParameter {
    readonly kind: `literal`;
    readonly name: string;
    readonly alias: string[];
}

export interface CommandHandler<TContext extends CommandContext> {
    get debugView(): string;
    readonly execute: (context: TContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSignature<TParameter = CommandParameter> {
    readonly description: IFormattable<string>;
    readonly parameters: readonly TParameter[];
    readonly hidden: boolean;
}

export interface CommandSignatureHandler<TContext extends CommandContext> extends CommandSignature {
    readonly execute: (context: TContext, args: readonly CommandArgument[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
}

export type CustomCommandShrinkwrap = {
    readonly [P in Exclude<keyof GuildSourceCommandTag, `author` | `authorizer` | `id`>]: GuildSourceCommandTag[P]
}

export interface GuildShrinkwrap {
    readonly cc: Record<string, CustomCommandShrinkwrap | undefined>;
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

export type SubtagDetails = Omit<Subtag, `execute` | `hidden`>;

export interface GuildDetails {
    readonly id: string;
    readonly name: string;
    readonly iconUrl?: string;
}

export interface GuildPermissionDetails {
    readonly userId: string;
    readonly guild: GuildDetails;
    readonly ccommands: boolean;
    readonly censors: boolean;
    readonly autoresponses: boolean;
    readonly rolemes: boolean;
    readonly interval: boolean;
    readonly greeting: boolean;
    readonly farewell: boolean;
}

export interface CommandListResult {
    [commandName: string]: ICommandDetails | undefined;
}

export interface ClusterStats {
    readonly id: number;
    readonly time: number;
    readonly readyTime: number;
    readonly guilds: number;
    readonly users: number;
    readonly channels: number;
    readonly rss: number;
    readonly userCpu: number;
    readonly systemCpu: number;
    readonly shardCount: number;
    readonly shards: readonly ShardStats[];
}

export interface ShardStats {
    readonly id: number;
    readonly status: Shard[`status`];
    readonly latency: number;
    readonly guilds: number;
    readonly cluster: number;
    readonly time: number;
}
export interface ClusterOptions {
    readonly id: number;
    readonly shardCount: number;
    readonly firstShardId: number;
    readonly lastShardId: number;
    readonly holidays: Record<string, string>;
}

export interface ClusterPoolOptions {
    worker?: string;
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

export type GuildCommandContext<TChannel extends KnownGuildTextableChannel = KnownGuildTextableChannel> = CommandContext<TChannel>;
export type PrivateCommandContext<TChannel extends KnownPrivateChannel = KnownPrivateChannel> = CommandContext<TChannel>;

export type CommandPropertiesSet = { [key in CommandType]: CommandProperties; }
export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly defaultPerms: bigint;
    readonly isVisible: (util: ClusterUtilities, location?: Guild | KnownTextableChannel, user?: User) => boolean | Promise<boolean>;
    readonly color: number;
}

export interface SubtagVariableProperties {
    table: string;
}

export type WhitelistResponse = `approved` | `rejected` | `requested` | `alreadyApproved` | `alreadyRejected`;

export type PollResponse = BasePollResponse<`OPTIONS_EMPTY` | `TOO_SHORT` | `FAILED_SEND` | `NO_ANNOUNCE_PERMS` | `ANNOUNCE_INVALID`> | PollSuccess | PollInvalidOption;

export interface BasePollResponse<T extends string> {
    readonly state: T;
}

export interface PollInvalidOption<T extends string = `OPTIONS_INVALID`> extends BasePollResponse<T> {
    readonly failedReactions: string[];
}

export interface PollSuccess extends PollInvalidOption<`SUCCESS`> {
    readonly message: KnownMessage;
}

export type EnsureMutedRoleResult = `success` | `unconfigured` | `noPerms`;
export type MuteResult = `success` | `alreadyMuted` | `noPerms` | `roleMissing` | `roleTooHigh` | `moderatorNoPerms` | `moderatorTooLow`;
export type UnmuteResult = `success` | `notMuted` | `noPerms` | `roleTooHigh` | `moderatorNoPerms` | `moderatorTooLow`;
export type BanResult = `success` | `alreadyBanned` | `noPerms` | `memberTooHigh` | `moderatorNoPerms` | `moderatorTooLow`;
export type MassBanResult = User[] | Exclude<BanResult, `success`> | `noUsers`;
export type KickResult = `success` | `noPerms` | `memberTooHigh` | `moderatorNoPerms` | `moderatorTooLow`;
export type UnbanResult = `success` | `notBanned` | `noPerms` | `moderatorNoPerms`;
export type TimeoutResult = `success` | `alreadyTimedOut` | `noPerms` | `moderatorNoPerms` | `memberTooHigh` | `moderatorTooLow`;
export type TimeoutClearResult = `success` | `notTimedOut` | `noPerms` | `moderatorNoPerms`;

export interface WarnDetails {
    readonly count: number;
    readonly banAt?: number;
    readonly kickAt?: number;
    readonly timeoutAt?: number;
}

export interface WarnResultBase<ModType extends ModerationType, TResult extends string> {
    readonly type: ModType;
    readonly warnings: number;
    readonly state: TResult;
}

export type WarnResult =
    | WarnResultBase<ModerationType.BAN, BanResult>
    | WarnResultBase<ModerationType.KICK, KickResult>
    | WarnResultBase<ModerationType.TIMEOUT, TimeoutResult>
    | WarnResultBase<ModerationType.WARN, `success` | `countNaN` | `countNegative` | `countZero`>;

export interface PardonResult {
    readonly warnings: number;
    readonly state: `success` | `countNaN` | `countNegative` | `countZero`;

}

export type CommandBinderParseResult =
    | CommandBinderValue
    | CommandBinderDeferred;

export type CommandBinderValue =
    | CommandBinderSuccess
    | CommandBinderFailure

export interface CommandBinderSuccess {
    success: true;
    value: CommandArgument;
}

export interface CommandBinderFailure {
    success: false;
    error: CommandBinderStateFailureReason;
}

export interface CommandBinderDeferred {
    success: `deferred`;
    getValue(): CommandBinderValue | Promise<CommandBinderValue>;
}

export interface CommandBinderStateLookupCache {
    findUser(userString: string): Awaitable<CommandBinderParseResult>;
    findSender(userString: string): Awaitable<CommandBinderParseResult>;
    findMember(memberString: string): Awaitable<CommandBinderParseResult>;
    findRole(roleString: string): Awaitable<CommandBinderParseResult>;
    findChannel(channelString: string): Awaitable<CommandBinderParseResult>;
}

export interface CommandBinderState<TContext extends CommandContext> {
    readonly context: TContext;
    readonly command: ScopedCommand<TContext>;
    readonly arguments: ReadonlyArray<CommandBinderDeferred | CommandBinderSuccess>;
    readonly flags: FlagResult;
    readonly argIndex: number;
    readonly bindIndex: number;
    readonly handler?: CommandSignatureHandler<TContext>;
    readonly lookupCache: CommandBinderStateLookupCache;
    addFailure(index: number, reason: CommandBinderStateFailureReason): void;
}

export interface CommandBinderStateFailureReason {
    notEnoughArgs?: string[];
    tooManyArgs?: boolean;
    parseFailed?: {
        value: string;
        types: string[];
    };
}
