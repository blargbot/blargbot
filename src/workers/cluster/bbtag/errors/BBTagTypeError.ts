import { BBTagRuntimeError } from './BBTagRuntimeError';

const an = new Set('aieou');
export class BBTagTypeError extends BBTagRuntimeError {
    public constructor(type: string, public readonly value: JToken) {
        super(`Not ${an.has(type[0]) ? 'an' : 'a'} ${type}`, `${JSON.stringify(value)} is not a ${type}`);
    }
}
