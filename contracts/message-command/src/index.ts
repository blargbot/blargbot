import type { ExtendedMessage } from '@blargbot/discord-message-stream-contract';
import type { StringSlice } from '@blargbot/input';

export interface MessageCommandDetails extends ExtendedMessage {
    readonly prefix: string;
    readonly command: string;
    readonly args: StringSlice[];
}
