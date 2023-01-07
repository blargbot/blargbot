import { BBTagRuntimeError } from '@bbtag/engine';

export class ChannelNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('No channel found', `${value} could not be found`);
    }
}
