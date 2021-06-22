import { BBTagContext } from '../BBTagContext';
import { Statement } from '../types';
import { SubtagArgumentValue } from './SubtagArgumentValue';

export class ExecutingSubtagArgumentValue implements SubtagArgumentValue {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #promise?: Promise<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #value?: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #defaultValue: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #context: BBTagContext;

    public readonly code: Statement;
    public get isCached(): boolean { return this.#value !== undefined; }
    public get raw(): string { return this.code.map(c => typeof c === 'string' ? c : c.source).join(''); }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(context: BBTagContext, code: Statement, defaultValue: string) {
        this.code = code;
        this.#context = context;
        this.#defaultValue = defaultValue;
    }

    public execute(): Promise<string> {
        return this.#promise = this.executeInner();
    }

    public wait(): Promise<string> {
        return this.#promise ??= this.execute();
    }

    private async executeInner(): Promise<string> {
        const result = await this.#context.eval(this.code);
        return this.#value = result || this.#defaultValue;
    }
}