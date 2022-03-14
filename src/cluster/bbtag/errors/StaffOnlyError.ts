import { BBTagRuntimeError } from './BBTagRuntimeError';

export class StaffOnlyError extends BBTagRuntimeError {
    public constructor(public readonly authorizer: string) {
        super('Authorizer must be staff', `Authorizer: ${authorizer}`);
    }
}
