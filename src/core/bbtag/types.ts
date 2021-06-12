import { Attachment, Embed, GuildTextableChannel, Member, User, EmbedOptions, MessageFile, GuildMessage } from 'eris';
import ReadWriteLock from 'rwlock';
import { FlagResult, FlagDefinition } from '../../utils';
import { StoredGuildCommand, StoredTag } from '../database';
import { VariableCache } from './Caching';
import { BBTagContext } from './BBTagContext';
import { BBRuntimeScope, ScopeCollection } from './ScopeCollection';
import { TagCooldownManager } from './TagCooldownManager';

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

export interface SourceToken {
    type: SourceTokenType;
    content: string;
    start: SourceMarker;
    end: SourceMarker;
}

export interface SerializedBBTagContext {
    msg: {
        id: string,
        timestamp: number,
        content: string,
        channel: { id: string, serialized: string },
        member: { id: string, serialized: string },
        attachments: Attachment[],
        embeds: Embed[]
    },
    isCC: boolean,
    state: Omit<BBTagContextState, 'cache' | 'overrides'>,
    scope: BBRuntimeScope,
    input: readonly string[],
    flaggedInput: FlagResult,
    tagName: string,
    author: string,
    authorizer: string,
    tagVars: boolean,
    tempVars: Record<string, string | undefined>
}

export interface BBTagContextMessage {
    id: string;
    timestamp: number,
    content: string,
    channel: GuildTextableChannel,
    member: Member,
    author: User,
    attachments: Attachment[],
    embeds: Embed[]
}

export interface BBTagContextState {
    query: {
        count: 0,
        user: Record<string, string | undefined>,
        role: Record<string, string | undefined>
    },
    outputMessage: Promise<string | null> | null,
    ownedMsgs: string[],
    return: RuntimeReturnState,
    stackSize: number,
    embed: undefined | EmbedOptions,
    file: undefined | MessageFile,
    reactions: string[],
    nsfw: undefined | string,
    /** @type {{regex: RegExp|string, with: string}} */
    replace: null | { regex: RegExp | string, with: string },
    break: number,
    continue: number,
    subtags: Record<string, number[] | undefined>,
    overrides: Record<string, SubtagHandler | undefined>,
    cache: Record<string, StoredGuildCommand | StoredTag | undefined>,
    subtagCount: number,
    allowedMentions: {
        users: string[],
        roles: string[],
        everybody: boolean
    }
}

export interface RuntimeError {
    readonly subtag: SubtagCall | null;
    readonly error: string | readonly RuntimeError[],
    readonly debugMessage: string | null
}

export interface RuntimeDebugEntry {
    subtag: SubtagCall;
    text: string;
}

export interface RuntimeLimit {
    check(context: BBTagContext, subtag: SubtagCall, subtagName: string): Promise<string | null> | string | null;
    rulesFor(subtagName: string): string[];
}

export const enum RuntimeReturnState {
    NONE = 0,
    CURRENTTAG = 1,
    ALL = -1
}

export interface BBTagContextOptions {
    readonly message: BBTagContextMessage | GuildMessage;
    readonly input: readonly string[];
    readonly flags?: readonly FlagDefinition[];
    readonly isCC: boolean;
    readonly tagVars?: boolean;
    readonly author?: string;
    readonly authorizer?: string;
    readonly tagName: string;
    readonly cooldown?: number;
    readonly cooldowns?: TagCooldownManager;
    readonly locks?: Record<string, ReadWriteLock | undefined>;
    readonly limit: RuntimeLimit | (new () => RuntimeLimit);
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
        values: Record<string, string | undefined>;
    };
}
export type SubtagResult =
    | string
    | undefined
    | void;

export interface SubtagArgumentValue {
    readonly isCached: boolean;
    value: string;
    code: Statement;
    raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}

export interface SubtagArgumentValueArray extends ReadonlyArray<SubtagArgumentValue> {
    readonly subtagName: string;
}

export interface SubtagHandlerCallSignature extends SubtagSignatureDetails {
    readonly execute: (this: unknown, context: BBTagContext, args: SubtagArgumentValueArray, subtagCall: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

export interface SubtagHandler {
    readonly execute: (this: unknown, context: BBTagContext, subtagName: string, call: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

export interface SubtagHandlerArgument {
    readonly name?: string;
    readonly required: boolean;
    readonly greedy: number | null;
    readonly autoResolve: boolean;
    readonly nestedArgs: readonly SubtagHandlerArgument[];
}

export interface SubtagSignatureDetails<TArgs = SubtagHandlerArgument> {
    readonly args: readonly TArgs[];
    readonly description: string;
    readonly exampleCode?: string;
    readonly exampleIn?: string;
    readonly exampleOut?: string;
}

export interface SubtagHandlerDefinition extends SubtagSignatureDetails<string | SubtagHandlerDefinitionArgumentGroup> {
    readonly execute: (this: unknown, context: BBTagContext, args: SubtagArgumentValueArray, subtagCall: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

export interface SubtagHandlerDefinitionArgumentGroup {
    readonly name?: string;
    readonly type?: 'optional' | 'required' | `${number}OrMore`;
    readonly args: ReadonlyArray<string | SubtagHandlerDefinitionArgumentGroup>;
}


