import type { SourceMarker, Statement, SubtagCall } from '@bbtag/language';
import type { Emote } from '@blargbot/discord-emote';
import type Discord from '@blargbot/discord-types';
import type { IFormattable } from '@blargbot/formatting';
import type { FlagDefinition } from '@blargbot/input';

import type { BBTagRuntimeError } from './errors/index.js';
import type { Entities } from './index.js';
import type { limits, RuntimeLimit } from './limits/index.js';
import type { ScopeManager } from './ScopeManager.js';
import type { SubtagCallStack } from './SubtagCallStack.js';
import type { SubtagType } from './utils/index.js';
import type { VariableCache } from './variables/Caching.js';

export * as Entities from './types.entities.js';

export * from './variables/TagVariableScope.js';
export * from './variables/TagVariableType.js';

export interface AnalysisResults {
    readonly errors: AnalysisResult[];
    readonly warnings: AnalysisResult[];
}

export interface AnalysisResult {
    readonly location: SourceMarker;
    readonly message: IFormattable<string>;
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
        content: string;
        channel: { id: string; serialized: string; };
        member?: { id: string; serialized: string; };
        attachments: Discord.APIAttachment[];
        embeds: Discord.APIEmbed[];
    };
    isCC: boolean;
    scope: {
        quiet?: boolean;
        fallback?: string;
        noLookupErrors?: boolean;
        reason?: string;
        inLock: boolean;
        paramsarray?: readonly string[];
        reaction?: string;
        reactUser?: string;
        functions: Record<string, Statement | undefined>;
        isTag: boolean;
    };
    inputRaw: string;
    flags: ReadonlyArray<FlagDefinition<string>>;
    data: {
        query: {
            count: number;
            user: Record<string, string | undefined>;
            role: Record<string, string | undefined>;
            channel: Record<string, string | undefined>;
        };
        ownedMsgs: string[];
        stackSize: number;
        allowedMentions: {
            users: string[];
            roles: string[];
            everybody: boolean;
        };
    };
    tagName: string;
    rootTagName: string;
    author: string | undefined;
    authorizer: string | undefined;
    prefix: string | undefined;
    tagVars: boolean;
    tempVars: JObject;
    limit: SerializedRuntimeLimit;
}

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
    embeds: undefined | Discord.APIEmbed[];
    file: undefined | {
        file: string;
        name: string;
    };
    reactions: string[];
    nsfw: undefined | string;
    replace: undefined | { regex: RegExp | string; with: string; };
    break: number;
    continue: number;
    subtags: Record<string, number[] | undefined>;
    cache: Record<string, { content: string; cooldown?: number; } | null>;
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
    readonly message: Entities.Message;
    readonly bot: Entities.User;
    readonly authorizer: Entities.User;
    readonly user: Entities.User;
    readonly channel: Entities.Channel;
    readonly guild: Entities.Guild;
    readonly isStaff: boolean;

    readonly inputRaw: string;
    readonly flags?: ReadonlyArray<FlagDefinition<string>>;
    readonly isCC: boolean;
    readonly tagVars?: boolean;
    readonly authorId?: string;
    readonly rootTagName?: string;
    readonly tagName?: string;
    readonly cooldown?: number;
    readonly limit: RuntimeLimit | keyof typeof limits;
    readonly silent?: boolean;
    readonly data?: Partial<BBTagContextState>;
    readonly scopes?: ScopeManager;
    readonly variables?: VariableCache;
    readonly callStack?: SubtagCallStack;
    readonly prefix?: string;
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

export interface SubtagSignature<TString> {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameter[];
    readonly description: TString;
    readonly exampleCode: TString;
    readonly exampleIn?: TString;
    readonly exampleOut: TString;
}

type AwaitableIterable<T> = (Iterable<T> | AsyncIterable<T>); // To exclude string

type SubtagReturnTypeValueMap = {
    hex: number;
    number: number | bigint;
    boolean: boolean;
    string: string;
    id: string;
    json: JToken;
    embed: Discord.APIEmbed;
    nothing: undefined;
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
    & SubtagReturnTypeUnion<['id', 'nothing']>
    // & SubtagReturnTypeUnion<['json', 'nothing']>
    & SubtagReturnTypeUnion<['json[]', 'nothing']>
    & SubtagReturnTypeUnion<['json', 'nothing']>
    & {
        unknown: AsyncIterable<string | undefined>;
        nothing: void;
        error: never;
        loop: AwaitableIterable<string>;
    }

export type SubtagReturnTypeMap = {
    [P in keyof SubtagReturnTypeMapHelper]: SubtagReturnTypeMapHelper[P]
}

export interface SubtagOptions<TString> {
    readonly category: SubtagType;
    readonly description?: TString;
    readonly deprecated?: string | boolean;
    readonly staff?: boolean;
    readonly hidden?: boolean;
    readonly signatures: ReadonlyArray<SubtagSignature<TString>>;
}

export type SubtagPropertiesSet = { [P in SubtagType]: SubtagProperties<P>; }

export interface SubtagProperties<Id extends SubtagType = SubtagType> {
    readonly id: Id;
    readonly name: IFormattable<string>;
    readonly desc: IFormattable<string>;
    readonly hidden?: boolean;
}

export interface AwaitReactionsResponse {
    readonly message: Entities.Message;
    readonly reaction: Emote;
    readonly user: Entities.User;
}
