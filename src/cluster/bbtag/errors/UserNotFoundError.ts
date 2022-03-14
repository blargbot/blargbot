import { BBTagRuntimeError } from './BBTagRuntimeError';

export class UserNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('No user found', `${value} could not be found`);
    }
}
