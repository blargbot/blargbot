import type Emote from '@blargbot/discord-emote';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagRuntimeError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import type { Subtag } from './Subtag.js';
import type { SubtagType } from './utils/index.js';

export type BBTagArray = { n?: string; v: JArray; };

export interface BBTagHooks {
    loop?: (subtag: Subtag) => Awaitable<void>;
    subtagExecuting?: (subtag: Subtag, call: SubtagCall) => Awaitable<Disposable | undefined>;
    internalServerError?: (error: unknown) => Awaitable<void>;
    step?: () => Awaitable<void>;
}

export interface BBTagRuntimeScope {
    tagName: string;
    messageId: string;
    channelId: string;
    userId: string;
    quiet: boolean | undefined;
    fallback: string | undefined;
    noLookupErrors: boolean | undefined;
    reason: string | undefined;
    inLock: boolean;
    paramsarray: readonly string[] | undefined;
    reaction: string | undefined;
    reactUser: string | undefined;
    input: BBTagInput;
}
export interface BBTagRuntimeRootScope extends BBTagRuntimeScope {
    readonly botId: string;
    readonly guildId: string;
    readonly recursion: { depth: number; };
    readonly output: {
        nsfw?: string;
        messageId?: string;
        embeds?: Embed[];
        files?: FileContent[];
        replace?: (value: string) => Promise<string>;
        readonly reactions: string[];
    };
    readonly authorId: string | undefined;
    readonly authorizerId: string;
    readonly prefix: string | undefined;
    readonly isCC: boolean;
    readonly tagVars: boolean;
    readonly silent: boolean;
    readonly functions: Map<string, BBTagExpression>;
    readonly queryCache: {
        failedQueries: number;
        readonly user: Map<string, string>;
        readonly role: Map<string, string>;
        readonly channel: Map<string, string>;
    };
    readonly ownedMessageIds: Set<string>;
    readonly tagCache: Map<string, TagDetails>;
    readonly ccCache: Map<string, TagDetails | 'alias'>;
    readonly allowedMentions: {
        readonly users: Set<string>;
        readonly roles: Set<string>;
        everybody: boolean;
    };
}

export interface BBTagInput {
    readonly array: readonly string[];
    readonly flags: FlagResult;
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

export interface QueryEntityOptions {
    readonly noLookup?: boolean;
    readonly noErrors?: boolean;
}

export interface QueryUserOptions extends QueryEntityOptions {
    readonly global?: boolean;
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
    embed: Embed;
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

export interface MessageEvent {
    readonly messageId: string;
    readonly channelId: string;
    readonly authorId: string;
    readonly guildId?: string;
}

export interface ReactionEvent extends MessageEvent {
    readonly reaction: Emote;
    readonly reactorId: string;
}

export interface TagDetails {
    readonly cooldown?: number;
    readonly content: string;
}

export interface FlagDefinition {
    readonly flag: Alphanumeric;
    readonly word: string;
}

type FlagResultBase = { readonly [P in Alphanumeric]?: string };
export interface FlagResult extends FlagResultBase {
    readonly _: string;
}

const flagChars = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_');
export function isFlagKey(value: string): value is keyof FlagResult {
    return flagChars.has(value);
}

export interface FileContent {
    file: Buffer;
    name: string;
}

export interface Embed {
    author?: EmbedAuthor;
    color?: number;
    description?: string;
    fields?: EmbedField[];
    footer?: EmbedFooter;
    image?: EmbedImage;
    thumbnail?: EmbedImage;
    timestamp?: Temporal.Instant;
    title?: string;
    url?: string;
}

export interface MalformedEmbed extends Embed {
    malformed: true;
}

export interface EmbedAuthor {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    icon_url?: string;
    name: string;
    url?: string;
}

export interface EmbedField {
    inline?: boolean;
    name: string;
    value: string;
}

export interface EmbedFooter {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    icon_url?: string;
    text: string;
}

export interface EmbedImage {
    url?: string;
}
