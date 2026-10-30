import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class RoleNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('No role found', `${value} could not be found`);
    }
}
