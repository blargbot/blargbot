import { markup } from '@blargbot/discord-util';

import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class MessageNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly channelId: string, public readonly value: string) {
        super('No message found', `${value} could not be found in ${markup.channel(channelId)}`);
    }
}
