import { BBTagRuntimeError } from './BBTagRuntimeError';

export class UnknownSubtagError extends BBTagRuntimeError {
    public constructor(public readonly subtagName: string) {
        super(`Unknown subtag ${subtagName}`);
    }
}
