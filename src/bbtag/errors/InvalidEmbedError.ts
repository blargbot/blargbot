import { BBTagRuntimeError } from './BBTagRuntimeError';

export class InvalidEmbedError extends BBTagRuntimeError {
    public constructor(message: string, details?: string) {
        super(`Invalid embed: ${message}`, details);
    }
}
