import { BBTagTypeError } from './BBTagTypeError';

export class NotABooleanError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('boolean', value);
    }
}
