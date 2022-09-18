import { Snowflake } from '@blargbot/domain/models';
import { Logger } from '@blargbot/logger';
import { AdvancedMessageContent, ChannelInteraction, EmbedField, EmbedOptions, FileContent, Guild, InteractionButton, KnownMessage, KnownTextableChannel, Member, SelectMenuOptions, User, UserChannelInteraction } from 'eris';

import { Binder } from './Binder';
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
export type ProcessMessageContext<TData, TReply> = { data: TData; id: Snowflake; reply: (data: TReply) => void; };
export type WorkerPoolEventContext<TWorker extends WorkerConnection<IPCContracts>, TData, TReply> = ProcessMessageContext<TData, TReply> & { worker: TWorker; };
export type ProcessMessageHandler<TData = unknown, TReply = unknown> = (context: ProcessMessageContext<TData, TReply>) => Awaitable<unknown>;
export type WorkerPoolEventHandler<TWorker extends WorkerConnection<IPCContracts>, TData = unknown, TReply = unknown> = (context: WorkerPoolEventContext<TWorker, TData, TReply>) => unknown;
export type EvalRequest = { userId: string; code: string; };
export type MasterEvalRequest = EvalRequest & { type: EvalType; };
export type GlobalEvalResult = Record<string, EvalResult>;
export type EvalResult = { success: false; error: string; } | { success: true; result: unknown; };
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
export type GetWorkerPoolEventHandler<Worker extends WorkerConnection<IPCContracts>, Contract extends WorkerIPCContractNames<Worker>> =
    Worker extends WorkerConnection<infer Contracts>
    ? WorkerPoolEventHandler<Worker, IPCContractMasterGets<Contracts, Contract>, IPCContractWorkerGets<Contracts, Contract>>
    : never;

export type WorkerIPCContractNames<Worker extends WorkerConnection<IPCContracts>> =
    Worker extends WorkerConnection<infer Contracts>
    ? IPCContractNames<Contracts>
    : never;

export type BaseIPCContract = {
    'stop': { masterGets: undefined; workerGets: undefined; };
    'ready': { masterGets: string; workerGets: never; };
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
