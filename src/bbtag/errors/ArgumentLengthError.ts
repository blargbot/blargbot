import { BBTagRuntimeError } from './BBTagRuntimeError';

export class ArgumentLengthError extends BBTagRuntimeError {
    public constructor(public readonly argIndex: number, public readonly max: number, public readonly actual: number) {
        super(`Argument length exceeded limit`, `Argument ${argIndex} is limited to ${max} but got a value of length ${actual}`);
    }
}
