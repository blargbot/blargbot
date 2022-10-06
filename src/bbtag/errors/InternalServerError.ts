import { BBTagRuntimeError } from './BBTagRuntimeError';

export class InternalServerError extends BBTagRuntimeError {
    public constructor(public readonly error: unknown) {
        super(`An internal server error has occurred`, error instanceof Error ? error.message : typeof error === `string` ? error : undefined);
    }
}
