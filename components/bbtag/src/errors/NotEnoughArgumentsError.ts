import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class NotEnoughArgumentsError extends BBTagRuntimeError {
    public constructor(public readonly min: number, public readonly actual: number) {
        super('Not enough arguments', `Expected ${min} arguments or more but got ${actual}`);
    }
}
