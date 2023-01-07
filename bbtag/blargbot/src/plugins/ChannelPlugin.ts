import type { QueryOptions } from './QueryPlugin.js';
import type { BBTagVariableValue } from './VariablesPlugin.js';

export abstract class ChannelPlugin {
    public abstract currentChannel: Channel

    public abstract getCategories(): Promise<string[]>;
    public abstract query(query: string, options: QueryOptions): Promise<Channel | undefined>;
}

export interface Channel {
    readonly id: string;
    readonly name: string;
    readonly category?: string;
    readonly nsfw: boolean;
    readonly type: ChannelType;
    readonly position: number;
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
