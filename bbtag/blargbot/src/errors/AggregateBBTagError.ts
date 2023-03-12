import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class AggregateBBTagError extends BBTagRuntimeError {
    public constructor(public readonly errors: readonly BBTagRuntimeError[]) {
        super(errors.map(e => e.message).join(', '), JSON.stringify(errors.map(e => e.detail)));
    }
}
