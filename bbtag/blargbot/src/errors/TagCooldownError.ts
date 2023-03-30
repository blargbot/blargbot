import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class TagCooldownError extends BBTagRuntimeError {
    public constructor(public readonly tagName: string, public readonly type: string, public readonly remainingMs: number) {
        super(`Cooldown: ${remainingMs}`, `${type} ${tagName}`);
    }
}
