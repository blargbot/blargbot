import { BBTagTypeError } from './BBTagTypeError';

export class NotAnArrayError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('array', value);
    }
}
