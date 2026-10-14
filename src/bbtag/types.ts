import type { Emote } from '@blargbot/core';
import type { FlagDefinition, FlagResult, GuildCommandTag, StoredTag } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';
import type * as eris from 'eris';

import type { VariableCache } from './Caching.js';
import type { BBTagRuntimeError } from './errors/index.js';
import type { BBTagExpression, SourceMarker, SubtagCall } from './language/index.js';
import type { RuntimeLimit } from './limits/index.js';
import type { SubtagType } from './utils/index.js';

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
    tagName: string;
    message: BBTagContextMessage;
    quiet: boolean | undefined;
    fallback: string | undefined;
    noLookupErrors: boolean | undefined;
    reason: string | undefined;
    inLock: boolean;
    paramsarray: readonly string[] | undefined;
    reaction: string | undefined;
    reactUser: string | undefined;
    input: BBTagInput;
    cooldown: number;
}
export interface BBTagRuntimeRootScope extends BBTagRuntimeScope {
    readonly recursion: { depth: number; };
    readonly output: {
        nsfw?: string;
        messageId?: string;
        embeds?: eris.EmbedOptions[];
        files?: eris.FileContent[];
        replace?: { regex: RegExp | string; with: string; };
        readonly reactions: string[];
    };
    readonly variables: VariableCache;
    readonly limit: RuntimeLimit;
    readonly author: string | undefined;
    readonly authorizer: string;
    readonly prefix: string | undefined;
    readonly isCC: boolean;
    readonly silent: boolean;
    readonly flagDefinitions: ReadonlyArray<FlagDefinition<string>>;
    readonly functions: Map<string, BBTagExpression>;
    readonly queryCache: {
        count: number;
        readonly user: Map<string, string>;
        readonly role: Map<string, string>;
        readonly channel: Map<string, string>;
    };
    readonly ownedMessageIds: Set<string>;
    readonly tagCache: Map<string, StoredTag>;
    readonly ccCache: Map<string, GuildCommandTag>;
    readonly allowedMentions: {
        readonly users: Set<string>;
        readonly roles: Set<string>;
        everybody: boolean;
    };
}

export interface BBTagRuntimeInput {
    readonly cooldown: number;
    readonly author: string | undefined;
    readonly authorizer: string | undefined;
    readonly prefix: string | undefined;
    readonly isCC: boolean;
    readonly tagVars: boolean;
    readonly tagName: string;
    readonly flagDefinitions: ReadonlyArray<FlagDefinition<string>>;
    readonly input: string;
    readonly limit: RuntimeLimit;
    readonly message: BBTagContextMessage;
    readonly silent: boolean;
}

export interface BBTagInput {
    readonly raw: string;
    readonly array: readonly string[];
    readonly flags: FlagResult;
}

export interface SerializedRuntimeLimit {
    type: string;
    rules: { [key: string]: JToken[]; };
}

export interface SerializedBBTagContext {
    msg: {
        id: string;
        timestamp: number;
        content: string;
        channel: { id: string; serialized: string; };
        member?: { id: string; serialized: string; };
        attachments: eris.Attachment[];
        embeds: eris.Embed[];
    };
    isCC: boolean;
    scope: {
        quiet?: boolean;
        fallback?: string;
        noLookupErrors?: boolean;
        reason?: string;
        inLock: boolean;
        paramsarray?: string[];
        reaction?: string;
        reactUser?: string;
        functions: Record<string, BBTagExpression>;
        isTag: boolean;
    };
    inputRaw: string;
    flags: ReadonlyArray<FlagDefinition<string>>;
    data: {
        query: {
            count: number;
            user: Record<string, string>;
            role: Record<string, string>;
            channel: Record<string, string>;
        };
        ownedMsgs: string[];
        allowedMentions: {
            users: string[];
            roles: string[];
            everybody: boolean;
        };
        stackSize: number;
    };
    tagName: string;
    rootTagName: string;
    author: string | undefined;
    authorizer: string | undefined;
    prefix: string | undefined;
    tagVars: boolean;
    tempVars: Record<string, JToken>;
    limit: SerializedRuntimeLimit;
}

export type BBTagContextMessage = {
    id: string;
    content: string;
    embeds: eris.Embed[];
    createdAt: number;
    channel: eris.KnownGuildTextableChannel;
    member: eris.Member;
    author: eris.User;
    attachments: eris.Attachment[];
}

export interface LocatedRuntimeError {
    readonly subtag: SubtagCall | undefined;
    readonly error: BBTagRuntimeError;
}

export interface RuntimeDebugEntry {
    subtag: SubtagCall;
    text: string;
}

type BBTagRuntimeState = typeof BBTagRuntimeState[keyof typeof BBTagRuntimeState];
// eslint-disable-next-line @typescript-eslint/naming-convention
const BBTagRuntimeState = Object.freeze({
    /** Indicates bbtag should continue to be executed */
    RUNNING: 0,
    /** Indicates the current tag should be terminated */
    RETURN: 1,
    /** Indicates the current execution should be terminated */
    ABORT: 2
});
export { BBTagRuntimeState };

export interface FindEntityOptions {
    noLookup?: boolean;
    noErrors?: boolean;
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
        readonly subtag: ReadonlyMap<string, readonly number[]>;
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

type AwaitableIterable<T> = Iterable<T> | AsyncIterable<T>; // To exclude string

type SubtagReturnTypeValueMap = {
    hex: number;
    number: number | bigint;
    boolean: boolean;
    string: string;
    id: string;
    json: JToken;
    embed: eris.Embed;
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
    readonly name: string;
    readonly aliases?: readonly string[];
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
    readonly message: eris.KnownMessage;
    readonly reaction: Emote;
    readonly user: eris.User;
}
