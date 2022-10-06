import { BBTagTypeError } from './BBTagTypeError';

export class NotANumberError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super(`a`, `number`, value);
    }
}
