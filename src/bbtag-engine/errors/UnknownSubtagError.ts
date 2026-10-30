import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class UnknownSubtagError extends BBTagRuntimeError {
    public constructor(public readonly subtagName: string) {
        super(`Unknown subtag ${subtagName}`);
    }
}
