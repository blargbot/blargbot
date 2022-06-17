import { BBTagRuntimeError } from './BBTagRuntimeError';

export class SubtagDisabledError extends BBTagRuntimeError {
    public constructor(public readonly subtagName: string, public readonly scopeName: string) {
        super(`{${subtagName}} is disabled in ${scopeName}`);
    }
}
