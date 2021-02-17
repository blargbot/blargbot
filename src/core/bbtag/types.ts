import { Attachment, Embed, GuildTextableChannel, Member, User, EmbedOptions, Message } from 'eris';
import ReadWriteLock from 'rwlock';
import { FlagResult, FlagDefinition } from '../../utils';
import { StoredGuildCommand, StoredTag } from '../RethinkDb';
import { VariableCache } from './Caching';
import { SubtagCallback, RuntimeContext } from './RuntimeContext';
import { BBRuntimeScope, ScopeCollection } from './ScopeCollection';
import { TagCooldownManager } from './TagCooldownManager';

export type BBString = Array<string | BBSubtagCall>;

export interface BBSubtagCall {
    name: BBString;
    args: BBString[];
    start: BBSourceMarker;
    end: BBSourceMarker;
}
export const enum BBSourceTokenType {
    CONTENT,
    STARTSUBTAG,
    ENDSUBTAG,
    ARGUMENTDELIMITER
}

export interface BBSourceMarker {
    index: number;
    line: number;
    column: number;
}

export interface BBSourceToken {
    type: BBSourceTokenType;
    content: string;
    start: BBSourceMarker;
    end: BBSourceMarker;
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
    input: string[],
    flaggedInput: FlagResult,
    tagName: string,
    author: string,
    authorizer: string,
    tagVars: boolean,
    tempVars: Record<string, JToken>
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
    file: null | { file: string | Buffer, name: string },
    reactions: string[],
    nsfw: undefined | string,
    /** @type {{regex: RegExp|string, with: string}} */
    replace: null | { regex: RegExp | string, with: string },
    break: number,
    continue: number,
    subtags: Record<string, number[] | undefined>,
    overrides: Record<string, SubtagCallback | undefined>,
    cache: Record<string, StoredGuildCommand | StoredTag | undefined>,
    subtagCount: number,
    allowedMentions: {
        users: string[],
        roles: string[],
        everybody: boolean
    }
}

export interface RuntimeError {
    subtag: BBSubtagCall;
    error: string | RuntimeError[]
}

export interface RuntimeDebugEntry {
    subtag: BBSubtagCall;
    text: string;
}

export interface RuntimeLimit {
    check(context: RuntimeContext, subtag: BBSubtagCall, subtagName: string): Promise<string | null> | string | null;
    rulesFor(subtagName: string): string[];
}

export const enum RuntimeReturnState {
    NONE = 0,
    CURRENTTAG = 1,
    ALL = -1
}

export interface RuntimeContextOptions {
    message: RuntimeContextMessage | Message<GuildTextableChannel>;
    input: string[];
    flags?: FlagDefinition[];
    isCC: boolean;
    tagVars?: boolean;
    author?: string;
    authorizer?: string;
    tagName: string;
    cooldown?: number;
    cooldowns?: TagCooldownManager;
    locks?: Record<string, ReadWriteLock | undefined>;
    limit: RuntimeLimit | (new () => RuntimeLimit);
    outputModify?: (context: RuntimeContext, output: string) => string;
    silent?: boolean;
    state?: Partial<RuntimeContextState>;
    scopes?: ScopeCollection;
    variables?: VariableCache;
}
