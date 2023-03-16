import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class RuntimeModuleOverflowError extends BBTagRuntimeError {
    public constructor(public readonly stackSize: number) {
        super(`Terminated recursive tag after ${stackSize} execs.`);
    }
}
