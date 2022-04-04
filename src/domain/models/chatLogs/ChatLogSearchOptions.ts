import { ChatLogType } from './ChatLogType';

export interface ChatLogSearchOptions {
    readonly channelId: string;
    readonly types: readonly ChatLogType[];
    readonly users: readonly string[];
    readonly exclude: readonly string[];
    readonly count: number;
}
