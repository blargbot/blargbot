import { ChatLogType } from './ChatLogType.js';

export interface ChatLogSearchOptions {
    readonly channelId: string;
    readonly types: readonly ChatLogType[];
    readonly users: readonly string[];
    readonly exclude: readonly string[];
    readonly count: number;
}
