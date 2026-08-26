import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class TooManyArgumentsError extends BBTagRuntimeError {
    public constructor(public readonly max: number, public readonly actual: number) {
        super('Too many arguments', `Expected ${max} arguments or fewer but got ${actual}`);
    }
}
