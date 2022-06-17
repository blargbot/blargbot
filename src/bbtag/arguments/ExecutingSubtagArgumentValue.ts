import { BBTagContext } from '../BBTagContext';
import { ArgumentLengthError } from '../errors';
import { Statement, SubtagCall } from '../language';
import { BBTagRuntimeState, SubtagSignatureValueParameter } from '../types';
import { SubtagArgument } from './SubtagArgument';

export class ExecutingSubtagArgumentValue implements SubtagArgument {
    #promise?: Promise<string>;
    #value?: string;

    public get isCached(): boolean { return this.#value !== undefined; }
    public get raw(): string { return this.code.source; }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(
        public readonly parameter: SubtagSignatureValueParameter,
        private readonly context: BBTagContext,
        public readonly call: SubtagCall,
        public readonly code: Statement
    ) {
    }

    public execute(): Promise<string> {
        return this.#promise = this.executeInner();
    }

    public wait(): Promise<string> {
        return this.#promise ??= this.execute();
    }

    private async executeInner(): Promise<string> {
        const result = await this.context.eval(this.code);
        if (result.length > this.parameter.maxLength) {
            this.context.data.state = BBTagRuntimeState.ABORT;
            throw new ArgumentLengthError(this.call.args.indexOf(this.code), this.parameter.maxLength, result.length);
        }
        return this.#value = result.length === 0 ? this.parameter.defaultValue : result;
    }
}
