import { Snowflake } from '@blargbot/domain/models';
import { Logger } from '@blargbot/logger';
import { ActionRow, AdvancedMessageContent, EmbedAuthor, EmbedField, EmbedFooter, EmbedOptions, FileContent, Guild, InteractionButton, KnownMessage, KnownTextableChannel, Member, SelectMenu, SelectMenuOptions, TextableChannel, URLButton, User } from 'eris';

import { Binder } from './Binder';
import { WorkerConnection } from './worker';

export type MalformedEmbed = { fields: [EmbedField]; malformed: true; };
export type ModuleResult<TModule> = { names: Iterable<string>; module: TModule; };
export type DMContext = string | KnownMessage | User | Member;
export type SendContext = TextableChannel | string | User;
export interface SendContent<TString> extends FormatAdvancedMessageContent<TString> {
    files?: FileContent[];
}

type ReplaceProps<T, U extends { [P in keyof T]?: unknown }> = { [P in keyof T]: P extends keyof U ? U[P] : T[P] }
export type FormatAdvancedMessageContent<TString> = ReplaceProps<AdvancedMessageContent, {
    components: Array<FormatActionRow<TString>>;
    content: TString;
    embeds: Array<FormatEmbedOptions<TString>>;
    embed: never;
    messageReferenceID: never;
}>;

export type FormatActionRow<TString> = ReplaceProps<ActionRow, {
    components: Array<FormatActionRowComponents<TString>>;
}>;

export type FormatActionRowComponents<TString> = FormatButton<TString> | FormatSelectMenu<TString>;
export type FormatButton<TString> = FormatInteractionButton<TString> | FormatURLButton<TString>;
export type FormatInteractionButton<TString> = ReplaceProps<InteractionButton, { label: TString; }>;
export type FormatURLButton<TString> = ReplaceProps<URLButton, { label: TString; }>;
export type FormatSelectMenu<TString> = ReplaceProps<SelectMenu, {
    placeholder: TString;
    options: Array<FormatSelectMenuOptions<TString>>;
}>;
export type FormatSelectMenuOptions<TString> = ReplaceProps<SelectMenuOptions, {
    description: TString;
    label: TString;
}>;
export type FormatEmbedOptions<TString> = ReplaceProps<EmbedOptions, {
    author: FormatEmbedAuthor<TString>;
    description: TString;
    fields: Array<FormatEmbedField<TString>>;
    footer: FormatEmbedFooter<TString>;
    title: TString;
}>;
export type FormatEmbedAuthor<TString> = ReplaceProps<EmbedAuthor, {
    name: TString;
}>;
export type FormatEmbedField<TString> = ReplaceProps<EmbedField, {
    name: TString;
    value: TString;
}>;
export type FormatEmbedFooter<TString> = ReplaceProps<EmbedFooter, {
    text: TString;
}>;

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
export type EvalType = `master` | `global` | `cluster${number}`

export type IPCContract<Worker, Master> = { workerGets: Worker; masterGets: Master; };
export type IPCContracts<ContractNames extends string = string> = { [ContractName in ContractNames]: IPCContract<unknown, unknown> }
export type IPCContractNames<Contracts extends IPCContracts> = string & keyof (Contracts & BaseIPCContract);

export type IPCContractMasterGets<Contracts extends IPCContracts, Contract extends IPCContractNames<Contracts>> = (Contracts & BaseIPCContract)[Contract][`masterGets`]
export type IPCContractWorkerGets<Contracts extends IPCContracts, Contract extends IPCContractNames<Contracts>> = (Contracts & BaseIPCContract)[Contract][`workerGets`]

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
    stop: { masterGets: undefined; workerGets: undefined; };
    ready: { masterGets: string; workerGets: never; };
    alive: { masterGets: Date; workerGets: never; };
    exit: { masterGets: { code: number | null; signal: NodeJS.Signals | null; }; workerGets: never; };
    close: { masterGets: { code: number | null; signal: NodeJS.Signals | null; }; workerGets: never; };
    disconnect: { masterGets: undefined; workerGets: never; };
    kill: { masterGets: unknown; workerGets: never; };
    error: { masterGets: Error; workerGets: never; };
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

export interface QueryOptionsBase<TString> {
    context: KnownTextableChannel | KnownMessage;
    actors: Iterable<string | User> | string | User;
    prompt?: Omit<SendContent<TString>, `components`> | TString;
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

export interface QuerySuccess<T> extends QueryBaseResult<`SUCCESS`> {
    readonly value: T;
}

export interface ConfirmQueryOptionsBase<TString> extends QueryOptionsBase<TString> {
    continue: QueryButton<TString>;
    cancel: QueryButton<TString>;
}

export type SlimConfirmQueryOptions<TString, T extends boolean | undefined = undefined> = Omit<ConfirmQueryOptions<TString, T>, `context` | `actors`>;
export type ConfirmQueryOptions<TString, T extends boolean | undefined = undefined> = ConfirmQueryOptionsBase<TString> & ConfirmQueryOptionsFallback<T>;

export interface ChoiceQueryOptions<TString, T> extends QueryOptionsBase<TString> {
    placeholder: TString;
    choices: Iterable<Omit<FormatSelectMenuOptions<TString>, `value`> & { value: T; }>;
}

export interface TextQueryOptionsBase<TString, T> extends QueryOptionsBase<TString> {
    cancel?: QueryButton<TString>;
    parse?: TextQueryOptionsParser<TString, T>;
}

export interface TextQueryOptionsParsed<TString, T> extends TextQueryOptionsBase<TString, T> {
    parse: TextQueryOptionsParser<TString, T>;
}

export type SlimTextQueryOptionsParsed<TString, T> = Omit<TextQueryOptionsParsed<TString, T>, `context` | `actors`>;

export interface TextQueryOptions<TString> extends TextQueryOptionsBase<TString, string> {
    parse?: undefined;
}

export type SlimTextQueryOptions<TString> = Omit<TextQueryOptions<TString>, `context` | `actors`>;

export interface TextQueryOptionsParser<TString, T> {
    (message: KnownMessage): Promise<TextQueryOptionsParseResult<TString, T>> | TextQueryOptionsParseResult<TString, T>;
}

export type TextQueryOptionsParseResult<TString, T> =
    | { readonly success: true; readonly value: T; }
    | { readonly success: false; readonly error?: Omit<SendContent<TString>, `components`>; }

export interface MultipleQueryOptions<TString, T> extends ChoiceQueryOptions<TString, T> {
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

export type ChoiceQueryResult<T> = QueryResult<`NO_OPTIONS` | `TIMED_OUT` | `CANCELLED` | `FAILED`, T>;
export type MultipleResult<T> = QueryResult<`NO_OPTIONS` | `EXCESS_OPTIONS` | `TIMED_OUT` | `CANCELLED` | `FAILED`, T[]>;
export type TextQueryResult<T> = QueryResult<`FAILED` | `TIMED_OUT` | `CANCELLED`, T>;

export type QueryButton<TString> =
    | TString
    | Partial<Omit<FormatInteractionButton<TString>, `disabled` | `type` | `customId`>>

export type EntityQueryOptions<TString, T> =
    | EntityPickQueryOptions<TString, T>
    | EntityFindQueryOptions<TString>

export type SlimEntityQueryOptions<TString, T> =
    | SlimEntityPickQueryOptions<TString, T>
    | SlimEntityFindQueryOptions<TString>

export interface BaseEntityQueryOptions<TString> extends QueryOptionsBase<TString> {
    placeholder?: TString;
}

export interface EntityPickQueryOptions<TString, T> extends BaseEntityQueryOptions<TString> {
    choices: Iterable<T>;
    filter?: string;
}

export type SlimEntityPickQueryOptions<TString, T> = Omit<EntityPickQueryOptions<TString, T>, `context` | `actors`>;

export interface EntityFindQueryOptions<TString> extends BaseEntityQueryOptions<TString> {
    guild: string | Guild;
    filter?: string;
}

export type SlimEntityFindQueryOptions<TString> = Omit<EntityFindQueryOptions<TString>, `context` | `actors`>;

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
