import { Duration } from 'moment-timezone';

import { ChatLog, ChatLogMessage, ChatLogSearchOptions, ChatLogType } from '../models';

export interface ChatLogsTable {
    add(message: ChatLogMessage, type: ChatLogType, lifespan?: number | Duration): Promise<void>;
    getByMessageId(messageId: string): Promise<ChatLog | undefined>;
    findAll(options: ChatLogSearchOptions): Promise<readonly ChatLog[]>;
    getAll(channelId: string, ids: readonly string[]): Promise<readonly ChatLog[]>;
}
