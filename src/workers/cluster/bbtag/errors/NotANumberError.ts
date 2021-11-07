import { BBTagTypeError } from './BBTagTypeError';

export class NotANumberError extends BBTagTypeError {
    public constructor(value: JToken) {
        super('number', value);
    }
}
