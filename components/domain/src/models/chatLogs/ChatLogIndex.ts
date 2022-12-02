import { ChatLogType } from './ChatLogType.js';

export interface ChatLogIndex<T = string> {
    readonly keycode: string;
    readonly channel: string;
    readonly channelName: string;
    readonly guildName: string;
    readonly users: readonly string[];
    readonly types: readonly ChatLogType[];
    readonly ids: readonly T[];
    readonly limit: number;
}
