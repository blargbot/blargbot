import { BBTagTypeError } from './BBTagTypeError';

export class NotAnArrayError extends BBTagTypeError {
    public constructor(value: JToken) {
        super('array', value);
    }
}
