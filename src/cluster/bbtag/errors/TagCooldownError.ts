import { Duration } from 'moment';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class TagCooldownError extends BBTagRuntimeError {
    public constructor(public readonly tagName: string, public readonly isCC: boolean, public readonly remaining: Duration) {
        super(`Cooldown: ${remaining.asMilliseconds()}`, `${isCC ? 'Custom command' : 'Tag'} ${tagName}`);
    }
}
