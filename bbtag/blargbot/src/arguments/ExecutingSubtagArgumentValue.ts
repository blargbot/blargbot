import type { Statement, SubtagCall } from '@bbtag/language';

import type { BBTagContext } from '../BBTagContext.js';
import { ArgumentLengthError } from '../errors/index.js';
import type { SubtagSignatureValueParameter } from '../types.js';
import { BBTagRuntimeState } from '../types.js';
import type { SubtagArgument } from './SubtagArgument.js';

export class ExecutingSubtagArgumentValue implements SubtagArgument {
    #promise?: Promise<string>;
    #value?: string;
    readonly #context: BBTagContext;

    public get isCached(): boolean { return this.#value !== undefined; }
    public get raw(): string { return this.code.source; }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(
        public readonly parameter: SubtagSignatureValueParameter,
        context: BBTagContext,
        public readonly call: SubtagCall,
        public readonly code: Statement
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
            this.#context.data.state = BBTagRuntimeState.ABORT;
            throw new ArgumentLengthError(this.call.args.indexOf(this.code), this.parameter.maxLength, result.length);
        }
        return this.#value = result.length === 0 ? this.parameter.defaultValue : result;
    }
}
