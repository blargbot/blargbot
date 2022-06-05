import { Emote } from '@blargbot/core/Emote';
import { FlagDefinition, NamedGuildCommandTag, StoredTag } from '@blargbot/domain/models';
import { Attachment, Embed, EmbedOptions, FileContent, KnownGuildTextableChannel, KnownMessage, Message, User } from 'eris';
import ReadWriteLock from 'rwlock';

import { VariableCache } from './Caching';
import { BBTagRuntimeError } from './errors';
import { SourceMarker, Statement, SubtagCall } from './language';
import type { limits, RuntimeLimit } from './limits';
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

export type BBTagArray = { n?: string; v: JArray; };

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
        member?: { id: string; serialized: string; };
        attachments: Attachment[];
        embeds: Embed[];
    };
    isCC: boolean;
    data: Omit<BBTagContextState, 'cache'>;
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
    readonly source: string;
    readonly tagName: string;
    readonly input: string;
    readonly content: string;
    readonly errors: LocatedRuntimeError[];
    readonly debug: RuntimeDebugEntry[];
    readonly duration: {
        readonly total: number;
        readonly database: number;
        readonly active: number;
        readonly subtag: { readonly [subtag: string]: readonly number[] | undefined; };
    };
    readonly database: {
        readonly committed: number;
        readonly values: JObject;
    };
    readonly loadedSources: readonly string[];
}

export type SubtagSignatureValueParameter =
    | OptionalSubtagSignatureParameter
    | RequiredSubtagSignatureParameter

export type SubtagSignatureParameter =
    | SubtagSignatureValueParameter
    | SubtagSignatureParameterGroup

export interface OptionalSubtagSignatureParameter {
    readonly name: string;
    readonly required: false;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface RequiredSubtagSignatureParameter {
    readonly name: string;
    readonly required: true;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface SubtagSignatureParameterGroup {
    readonly minRepeats: number;
    readonly nested: readonly RequiredSubtagSignatureParameter[];
}

export interface SubtagSignature {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameter[];
    readonly description: string;
    readonly exampleCode: string;
    readonly exampleIn?: string;
    readonly exampleOut: string;
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
        'unknown': AsyncIterable<string | undefined>;
        'nothing': void;
        'error': never;
        'loop': AwaitableIterable<string>;
    }

export type SubtagReturnTypeMap = {
    [P in keyof SubtagReturnTypeMapHelper]: SubtagReturnTypeMapHelper[P]
}

export interface SubtagOptions {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: SubtagType;
    readonly description?: string;
    readonly deprecated?: string | boolean;
    readonly staff?: boolean;
    readonly hidden?: boolean;
    readonly signatures: readonly SubtagSignature[];
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
