import { BBTagRuntimeError } from './BBTagRuntimeError';

export class TooManyLoopsError extends BBTagRuntimeError {
    public constructor(public readonly max: number) {
        super('Too many loops', `There is a limit of ${max} loops`);
    }
}
