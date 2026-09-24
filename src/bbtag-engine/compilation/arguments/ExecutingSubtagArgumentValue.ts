import type { BBTagContext } from '../../BBTagContext.js';
import { ArgumentLengthError } from '../../BBTagRuntimeError.js';
import type { BBTagExpression, BBTagSubtag } from '../../language/index.js';
import type { SubtagSignatureValueParameter } from '../../types.js';
import type { SubtagArgument } from './SubtagArgument.js';

export class ExecutingSubtagArgumentValue<Locals extends object> implements SubtagArgument {
    #promise?: Promise<string>;
    #value?: string;
    readonly #context: BBTagContext<Locals>;

    public get raw(): string { return this.code.source; }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(
        public readonly parameter: SubtagSignatureValueParameter,
        context: BBTagContext<Locals>,
        public readonly call: BBTagSubtag,
        public readonly code: BBTagExpression
    ) {
        this.#context = context;
    }

    public execute(): Promise<string> {
        return this.#promise = this.#executeInner();
    }

    public wait(): Promise<string> {
        return this.#promise ??= this.execute();
    }

    async #executeInner(): Promise<string> {
        const result = await this.#context.eval(this.code);
        if (result.length > this.parameter.maxLength) {
            this.#context.returnDepth = Infinity;
            throw new ArgumentLengthError(this.call.args.indexOf(this.code), this.parameter.maxLength, result.length);
        }
        return this.#value = result.length === 0 ? this.parameter.defaultValue : result;
    }
}
