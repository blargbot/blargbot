import { BBTagRuntimeError } from './BBTagRuntimeError.js';

export class SubtagStackOverflowError extends BBTagRuntimeError {
    public constructor(public readonly stackSize: number) {
        super(`Terminated recursive tag after ${stackSize} execs.`);
    }

    public override toString(): string {
        return BBTagRuntimeError.prototype.toString.call(this);
    }
}
