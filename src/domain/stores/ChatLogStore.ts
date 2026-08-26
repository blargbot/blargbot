import type moment from 'moment-timezone';

import type { ChatLog, ChatLogMessage, ChatLogSearchOptions, ChatLogType } from '../models/index.js';

export interface ChatLogStore {
    add(message: ChatLogMessage, type: ChatLogType, lifespan?: number | moment.Duration): Promise<void>;
    getByMessageId(messageId: string): Promise<ChatLog | undefined>;
    findAll(options: ChatLogSearchOptions): Promise<readonly ChatLog[]>;
    getAll(channelId: string, ids: readonly string[]): Promise<readonly ChatLog[]>;
}
