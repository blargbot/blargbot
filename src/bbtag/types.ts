import { Emote } from '@blargbot/core/Emote';
import { FlagDefinition, NamedGuildCommandTag, StoredTag } from '@blargbot/core/types';
import { Attachment, Embed, EmbedOptions, FileContent, KnownGuildTextableChannel, KnownMessage, Message, User } from 'eris';
import ReadWriteLock from 'rwlock';

import { BBTagContext } from './BBTagContext';
import { VariableCache } from './Caching';
import { BBTagRuntimeError } from './errors';
import type { limits } from './limits';
import { ScopeManager } from './ScopeManager';
import { SubtagCallStack } from './SubtagCallStack';
import { TagCooldownManager } from './TagCooldownManager';
import { SubtagType } from './utils';

export interface AnalysisResults {
    readonly errors: AnalysisResult[];
    readonly warnings: AnalysisResult[];
}

export interface AnalysisResult {
    readonly location: SourceMarker;
    readonly message: string;
}

export interface SubtagCall {
    readonly name: Statement;
    readonly args: readonly Statement[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}

export interface Statement {
    readonly values: ReadonlyArray<string | SubtagCall>;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}

export const enum SourceTokenType {
    CONTENT,
    STARTSUBTAG,
    ENDSUBTAG,
    ARGUMENTDELIMITER
}

export interface SourceMarker {
    readonly index: number;
    readonly line: number;
    readonly column: number;
}
export type BBTagArray = { n?: string; v: JArray; };

export interface SourceToken {
    type: SourceTokenType;
    content: string;
    start: SourceMarker;
    end: SourceMarker;
}

export interface BBTagRuntimeScope {
    // Everything here should be immutable types.
    // Mutable types will modify globally when editing a local scope if not careful

    quiet?: boolean;
    fallback?: string;
    noLookupErrors?: boolean;
    reason?: string;
    inLock: boolean;
    paramsarray?: readonly string[];
    reaction?: string;
    reactUser?: string;

    // Functions are intended to be stored globally so a mutable type is fine
    readonly functions: Record<string, Statement | undefined>;
    readonly isTag: boolean;
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
    inputRaw: string;
    flags: readonly FlagDefinition[];
    tagName: string;
    rootTagName: string;
    author: string;
    authorizer: string;
    tagVars: boolean;
    tempVars: JObject;
    limit: SerializedRuntimeLimit;
}

export type BBTagContextMessage = Pick<Message<KnownGuildTextableChannel>,
    | 'id'
    | 'createdAt'
    | 'content'
    | 'channel'
    | 'member'
    | 'author'
    | 'attachments'
    | 'embeds'
>
export interface BBTagContextState {
    query: {
        count: number;
        user: Record<string, string | undefined>;
        role: Record<string, string | undefined>;
        channel: Record<string, string | undefined>;
    };
    outputMessage: string | undefined;
    ownedMsgs: string[];
    state: BBTagRuntimeState;
    stackSize: number;
    embeds: undefined | EmbedOptions[];
    file: undefined | FileContent;
    reactions: string[];
    nsfw: undefined | string;
    replace: undefined | { regex: RegExp | string; with: string; };
    break: number;
    continue: number;
    subtags: Record<string, number[] | undefined>;
    cache: Record<string, NamedGuildCommandTag | StoredTag | null>;
    subtagCount: number;
    allowedMentions: {
        users: string[];
        roles: string[];
        everybody: boolean;
    };

}

export interface LocatedRuntimeError {
    readonly subtag: SubtagCall | undefined;
    readonly error: BBTagRuntimeError;
}

export interface RuntimeDebugEntry {
    subtag: SubtagCall;
    text: string;
}

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly scopeName: string;
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): string[];
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}

export const enum BBTagRuntimeState {
    /** Indicates bbtag should continue to be executed */
    RUNNING,
    /** Indicates the current tag should be terminated */
    RETURN,
    /** Indicates the current execution should be terminated */
    ABORT
}

export interface FindEntityOptions {
    noLookup?: boolean;
    noErrors?: boolean;
}

export interface BBTagContextOptions {
    readonly message: BBTagContextMessage;
    readonly inputRaw: string;
    readonly flags?: readonly FlagDefinition[];
    readonly isCC: boolean;
    readonly tagVars?: boolean;
    readonly authorId: string;
    readonly authorizerId?: string;
    readonly rootTagName?: string;
    readonly tagName?: string;
    readonly cooldown?: number;
    readonly cooldowns?: TagCooldownManager;
    readonly locks?: Record<string, ReadWriteLock | undefined>;
    readonly limit: RuntimeLimit | keyof typeof limits;
    readonly silent?: boolean;
    readonly data?: Partial<BBTagContextState>;
    readonly scopes?: ScopeManager;
    readonly variables?: VariableCache;
    readonly callStack?: SubtagCallStack;
}

export interface ExecutionResult {
    source: string;
    tagName: string;
    input: string;
    content: string;
    errors: LocatedRuntimeError[];
    debug: RuntimeDebugEntry[];
    duration: {
        total: number;
        database: number;
        active: number;
        subtag: Record<string, number[] | undefined>;
    };
    database: {
        committed: number;
        values: JObject;
    };
}
export interface SubtagHandlerCallSignature extends SubtagSignatureDetails {
    readonly implementation: SubtagLogic<SubtagResult>;
}

export type SubtagResult = AsyncIterable<string | undefined>;

export interface SubtagLogic<T> {
    execute(context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall): T;
}

export interface CompositeSubtagHandler extends SubtagHandler {
    readonly handlers: readonly ConditionalSubtagHandler[];
}

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: SubtagCall): boolean;
}

export interface SubtagHandler {
    execute(context: BBTagContext, subtagName: string, call: SubtagCall): SubtagResult;
}

export type SubtagHandlerValueParameter =
    | OptionalSubtagHandlerParameter
    | RequiredSubtagHandlerParameter

export type SubtagHandlerParameter =
    | SubtagHandlerValueParameter
    | SubtagHandlerParameterGroup

export interface OptionalSubtagHandlerParameter {
    readonly name: string;
    readonly required: false;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface RequiredSubtagHandlerParameter {
    readonly name: string;
    readonly required: true;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface SubtagHandlerParameterGroup {
    readonly minRepeats: number;
    readonly nested: readonly RequiredSubtagHandlerParameter[];
}

export interface SubtagSignatureDetails<TArgs = SubtagHandlerParameter> {
    readonly parameters: readonly TArgs[];
    readonly description?: string;
    readonly exampleCode?: string;
    readonly exampleIn?: string;
    readonly exampleOut?: string;
    readonly returns: keyof SubtagReturnTypeMap;
}

interface SubtagHandlerDefinition<Type extends keyof SubtagReturnTypeMap>
    extends SubtagSignatureDetails<string | SubtagHandlerDefinitionParameterGroup>,
    SubtagLogic<Awaitable<SubtagReturnTypeMap[Type]>> {
    readonly returns: Type;
}

type AwaitableIterable<T> = (Iterable<T> | AsyncIterable<T>); // To exclude string

type SubtagReturnTypeValueMap = {
    'hex': number;
    'number': number | bigint;
    'boolean': boolean;
    'string': string;
    'id': string;
    'json': JToken;
    'embed': Embed;
    'nothing': undefined;
}

type SubtagReturnTypeAtomicMap = SubtagReturnTypeValueMap & {
    [P in keyof SubtagReturnTypeValueMap as `${P}[]`]: AwaitableIterable<SubtagReturnTypeValueMap[P]>;
}

type SubtagReturnTypeUnion<T extends Array<keyof SubtagReturnTypeAtomicMap>, Other = never> = {
    [P in ArrayJoin<T, '|'>]: SubtagReturnTypeAtomicMap[T[number]] | Other;
}

type SubtagReturnTypeMapHelper = Omit<SubtagReturnTypeAtomicMap, 'nothing'>
    & SubtagReturnTypeUnion<['number', 'number[]']>
    & SubtagReturnTypeUnion<['boolean', 'number']>
    & SubtagReturnTypeUnion<['string', 'nothing']>
    // & SubtagReturnTypeUnion<['json', 'nothing']>
    & SubtagReturnTypeUnion<['json[]', 'nothing']>
    & SubtagReturnTypeUnion<['json', 'nothing']>
    & {
        'unknown': SubtagResult;
        'nothing': void;
        'error': never;
        'loop': AwaitableIterable<string>;
    }

export type SubtagReturnTypeMap = {
    [P in keyof SubtagReturnTypeMapHelper]: SubtagReturnTypeMapHelper[P]
}

export type AnySubtagHandlerDefinition = { [P in keyof SubtagReturnTypeMap]: SubtagHandlerDefinition<P> }[keyof SubtagReturnTypeMap];

export interface SubtagHandlerDefinitionParameterGroup {
    readonly minCount?: number;
    readonly repeat: readonly string[];
}

export interface SubtagOptions {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: SubtagType;
    readonly desc?: string;
    readonly deprecated?: string | boolean;
    readonly staff?: boolean;
    readonly hidden?: boolean;
    readonly signatures: readonly SubtagSignatureDetails[];
}

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    displayText(subtagName: string, scopeName: string): string;
    state(): JToken;
    load(state: JToken): void;
}
export interface SubtagArgument {
    readonly parameter: SubtagHandlerValueParameter;
    readonly isCached: boolean;
    readonly value: string;
    readonly code: Statement;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}

export interface SubtagArgumentArray extends ReadonlyArray<SubtagArgument> {
    readonly subtagName: string;
}

export interface ArgumentResolver {
    readonly minArgs: number;
    readonly maxArgs: number;
    isExactMatch(subtag: SubtagCall): boolean;
    resolve(context: BBTagContext, subtagName: string, subtag: SubtagCall): Iterable<SubtagArgument>;
}

export type SubtagPropertiesSet = { [key in SubtagType]: SubtagProperties; }

export interface SubtagProperties {
    readonly name: string;
    readonly desc: string;
    readonly hidden?: boolean;
}

export interface AwaitReactionsResponse {
    readonly message: KnownMessage;
    readonly reaction: Emote;
    readonly user: User;
}
