import type { BBTagSubtag } from './language/BBTagSubtag.js';

export interface LocatedBBTagRuntimeError {
    readonly error: BBTagRuntimeError;
    readonly bbtag: BBTagSubtag;
}
export class BBTagRuntimeError extends Error {
    public display?: string;

    public constructor(
        message: string,
        public readonly detail?: string
    ) {
        super(message);
    }

    public withDisplay(error?: string): this {
        this.display = error;
        return this;
    }
}
export class BBTagTypeError extends BBTagRuntimeError {
    public constructor(a: 'a' | 'an', type: string, public readonly value: JToken | undefined) {
        super(`Not ${a} ${type}`, `${JSON.stringify(value)} is not ${a} ${type}`);
    }
}

export class InternalServerError extends BBTagRuntimeError {
    public constructor(error: unknown) {
        super('An internal server error has occurred', error instanceof Error ? error.message : typeof error === 'string' ? error : undefined);
        this.cause = error;
    }
}
export class UnknownSubtagError extends BBTagRuntimeError {
    public constructor(public readonly subtagName: string) {
        super(`Unknown subtag ${subtagName}`);
    }
}
export class ArgumentLengthError extends BBTagRuntimeError {
    public constructor(public readonly argIndex: number, public readonly max: number, public readonly actual: number) {
        super('Argument length exceeded limit', `Argument ${argIndex} is limited to ${max} but got a value of length ${actual}`);
    }
}
export class TooManyArgumentsError extends BBTagRuntimeError {
    public constructor(public readonly max: number, public readonly actual: number) {
        super('Too many arguments', `Expected ${max} arguments or fewer but got ${actual}`);
    }
}
export class NotEnoughArgumentsError extends BBTagRuntimeError {
    public constructor(public readonly min: number, public readonly actual: number) {
        super('Not enough arguments', `Expected ${min} arguments or more but got ${actual}`);
    }
}
export class NotABooleanError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('a', 'boolean', value);
    }
}

export class NotAnArrayError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('an', 'array', value);
    }
}
export class NotANumberError extends BBTagTypeError {
    public constructor(value: JToken | undefined) {
        super('a', 'number', value);
    }
}
export class InvalidOperatorError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('Invalid operator', `${JSON.stringify(value)} is not an allowed operator`);
    }
}
export class AggregateBBTagError extends BBTagRuntimeError {
    public constructor(public readonly errors: readonly BBTagRuntimeError[]) {
        super(errors.map(e => e.message).join(', '), JSON.stringify(errors.map(e => e.detail)));
    }
}
