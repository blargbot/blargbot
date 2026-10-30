import { BBTagTypeError } from './BBTagTypeError.js';

export class NotAnArrayError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('an', 'array', value);
    }
}
