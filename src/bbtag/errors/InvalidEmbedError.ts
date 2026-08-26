import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class InvalidEmbedError extends BBTagRuntimeError {
    public constructor(message: string, details?: string) {
        super(`Invalid embed: ${message}`, details);
    }
}
