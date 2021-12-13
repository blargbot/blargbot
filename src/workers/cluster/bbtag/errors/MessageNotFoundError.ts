import { humanize } from '@cluster/utils';
import { KnownChannel } from 'eris';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class MessageNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly channel: KnownChannel, public readonly value: string) {
        super('No message found', `${value} could not be found in ${humanize.channelName(channel)} (${channel.id})`);
    }
}
