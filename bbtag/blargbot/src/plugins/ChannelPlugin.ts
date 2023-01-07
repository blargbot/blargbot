import type { QueryOptions } from './QueryPlugin.js';
import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class ChannelPlugin {
    public abstract get current(): Channel
    public abstract get all(): Channel[]

    public abstract getCategories(): Promise<string[]>;
    public abstract query(query: string, options: QueryOptions): Promise<Channel | undefined>;

    public abstract createPermission: bigint;
    public abstract create(name: string, type: ChannelType, options: ChannelCreateOptions): Promise<Channel | string>;

    public abstract deletePermission: bigint;
    public abstract delete(id: string, options: ChannelDeleteOptions): Promise<true | string>;

    public abstract editPermission: bigint;
    public abstract edit(id: string, options?: ChannelEditOptions): Promise<true | string>;
    public abstract edit(id: string, options?: ThreadEditOptions): Promise<true | string>;
    public abstract editOverride(id: string, type: OverrideType, entityId: string, allow: bigint, deny: bigint): Promise<true | string>;
}

export interface ChannelDeleteOptions {
    readonly reason?: string;
}

export interface ChannelCreateOptions {
    readonly bitrate?: number;
    readonly nsfw?: boolean;
    readonly parentID?: string;
    readonly rateLimitPerUser?: number;
    readonly topic?: string;
    readonly userLimit?: number;
    readonly permissionOverwrites?: Array<{
        readonly allow: bigint;
        readonly deny: bigint;
        readonly id: string;
        readonly type: OverrideType;
    }>;
    readonly reason?: string;
}

export interface ChannelEditOptions {
    readonly bitrate?: number;
    readonly name?: string;
    readonly nsfw?: boolean;
    readonly parentID?: string;
    readonly rateLimitPerUser?: number;
    readonly topic?: string;
    readonly userLimit?: number;
    readonly defaultAutoArchiveDuration?: AutoArchiveDuration;
    readonly locked?: boolean;
    readonly position?: number;
}

export interface ThreadEditOptions {
    readonly archived?: boolean;
    readonly autoArchiveDuration?: AutoArchiveDuration;
    readonly locked?: boolean;
    readonly name?: string;
    readonly rateLimitPerUser?: number;
    readonly invitable?: boolean;
}

export interface Channel {
    readonly id: string;
    readonly name: string;
    readonly category?: string;
    readonly nsfw: boolean;
    readonly type: ChannelType;
    readonly position?: number;
    readonly lastMessageId?: string;
    readonly json: { readonly [prop: string]: BBTagVariableValue; };
}

export const enum ChannelType {
    TEXT = 'text',
    DM = 'dm',
    VOICE = 'voice',
    GROUP_DM = 'group-dm',
    CATEGORY = 'category',
    NEWS = 'news',
    STORE = 'store',
    THREAD_NEWS = 'news-thread',
    THREAD_PRIVATE = 'private-thread',
    THREAD_PUBLIC = 'public-thread',
    VOICE_STAGE = 'stage-voice'
}

export const enum OverrideType {
    MEMBER = 'member',
    ROLE = 'role'
}

export type AutoArchiveDuration = 60 | 1440 | 4320 | 10080;
