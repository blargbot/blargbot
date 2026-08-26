import { BBTagTypeError } from './BBTagTypeError.js';

export class NotABooleanError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('a', 'boolean', value);
    }
}
