import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class TagCooldownError extends BBTagRuntimeError {
    public constructor(public readonly tagName: string, public readonly isCC: boolean, public readonly remainingMs: number) {
        super(`Cooldown: ${remainingMs}`, `${isCC ? 'Custom command' : 'Tag'} ${tagName}`);
    }
}
