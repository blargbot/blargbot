import { Attachment, Embed, GuildTextableChannel, Member, User, EmbedOptions, Message, MessageFile } from 'eris';
import ReadWriteLock from 'rwlock';
import { FlagResult, FlagDefinition } from '../../utils';
import { StoredGuildCommand, StoredTag } from '../database';
import { VariableCache } from './Caching';
import { RuntimeContext } from './RuntimeContext';
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

export interface SerializedRuntimeContext {
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
    state: Omit<RuntimeContextState, 'cache' | 'overrides'>,
    scope: BBRuntimeScope,
    input: readonly string[],
    flaggedInput: FlagResult,
    tagName: string,
    author: string,
    authorizer: string,
    tagVars: boolean,
    tempVars: Record<string, string | undefined>
}

export interface RuntimeContextMessage {
    id: string;
    timestamp: number,
    content: string,
    channel: GuildTextableChannel,
    member: Member,
    author: User,
    attachments: Attachment[],
    embeds: Embed[]
}

export interface RuntimeContextState {
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
    subtag: SubtagCall | null;
    error: string | RuntimeError[]
}

export interface RuntimeDebugEntry {
    subtag: SubtagCall;
    text: string;
}

export interface RuntimeLimit {
    check(context: RuntimeContext, subtag: SubtagCall, subtagName: string): Promise<string | null> | string | null;
    rulesFor(subtagName: string): string[];
}

export const enum RuntimeReturnState {
    NONE = 0,
    CURRENTTAG = 1,
    ALL = -1
}

export interface RuntimeContextOptions {
    message: RuntimeContextMessage | Message<GuildTextableChannel>;
    input: readonly string[];
    flags?: DeepReadOnly<FlagDefinition[]>;
    isCC: boolean;
    tagVars?: boolean;
    author?: string;
    authorizer?: string;
    tagName: string;
    cooldown?: number;
    cooldowns?: TagCooldownManager;
    locks?: Record<string, ReadWriteLock | undefined>;
    limit: RuntimeLimit | (new () => RuntimeLimit);
    // outputModify?: (context: RuntimeContext, output: string) => string;
    silent?: boolean;
    state?: Partial<RuntimeContextState>;
    scopes?: ScopeCollection;
    variables?: VariableCache;
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

export interface SubtagArgument {
    readonly isCached: boolean;
    value: string;
    raw: Statement;
    wait(): Promise<string>;
}

export interface SubtagSignatureHandler {
    readonly resolve?: Array<number> | false;
    readonly execute: (context: RuntimeContext, args: SubtagArgument[], call: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}

interface DefaultSubtagHandlerDefinition {
    readonly default: SubtagSignatureHandler | SubtagSignatureHandler['execute'];
}

interface ConditionalSubtagHandlerDefinition {
    readonly whenArgCount: {
        readonly [argCount: string]: SubtagSignatureHandler | SubtagSignatureHandler['execute']
    }
}

export type SubtagHandlerDefintion =
    | DefaultSubtagHandlerDefinition
    | ConditionalSubtagHandlerDefinition
    | (DefaultSubtagHandlerDefinition & ConditionalSubtagHandlerDefinition)

export interface SubtagHandler {
    readonly execute: (context: RuntimeContext, call: SubtagCall) => Promise<SubtagResult> | SubtagResult;
}