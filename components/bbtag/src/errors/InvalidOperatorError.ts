import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class InvalidOperatorError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('Invalid operator', `${JSON.stringify(value)} is not an allowed operator`);
    }
}
