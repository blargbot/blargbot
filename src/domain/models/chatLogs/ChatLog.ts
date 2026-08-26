import type { ChatLogMessage } from './ChatLogMessage.js';
import type { ChatLogType } from './ChatLogType.js';

export interface ChatLog extends ChatLogMessage {
    readonly id: string;
    readonly msgtime: Date;
    readonly type: ChatLogType;
}
