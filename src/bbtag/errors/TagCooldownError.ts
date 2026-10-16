import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class TagCooldownError extends BBTagRuntimeError {
    public constructor(public readonly tagName: string, public readonly isCC: boolean, public readonly remaining: Temporal.Duration) {
        super(`Cooldown: ${remaining.total({ unit: 'milliseconds', relativeTo: Temporal.Now.zonedDateTimeISO() })}`, `${isCC ? 'Custom command' : 'Tag'} ${tagName}`);
    }
}
