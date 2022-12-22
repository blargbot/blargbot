import { BBTagRuntimeError } from '@bbtag/engine';

export class BBTagTypeError extends BBTagRuntimeError {
    public constructor(a: 'a' | 'an', type: string, public readonly value: JToken | undefined) {
        super(`Not ${a} ${type}`, `${JSON.stringify(value)} is not ${a} ${type}`);
    }
}
