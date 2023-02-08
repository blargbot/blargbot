import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class StaffOnlyError extends BBTagRuntimeError {
    public constructor(public readonly authorizer: string) {
        super('Author must be staff', `Authorizer: ${authorizer}`);
    }
}
