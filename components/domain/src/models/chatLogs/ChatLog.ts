import { ChatLogMessage } from './ChatLogMessage';
import { ChatLogType } from './ChatLogType';

export interface ChatLog extends ChatLogMessage {
    readonly id: string;
    readonly msgtime: Date;
    readonly type: ChatLogType;
}
