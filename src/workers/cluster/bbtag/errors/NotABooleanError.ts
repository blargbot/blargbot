import { BBTagTypeError } from './BBTagTypeError';

export class NotABooleanError extends BBTagTypeError {
    public constructor(value: JToken) {
        super('boolean', value);
    }
}
