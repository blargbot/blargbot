import { BBTagContext } from '../BBTagContext';
import { Statement, SubtagArgumentValue as ISubtagArgumentValue } from '../types';

export class SubtagArgumentValue implements ISubtagArgumentValue {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #promise?: Promise<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #value?: string;

    public readonly code: Statement;
    public get isCached(): boolean { return this.#value !== undefined; }
    public get raw(): string { throw new Error('Not implemented yet'); }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(private readonly context: BBTagContext, code: Statement) {
        this.code = code;
    }
    public async execute(): Promise<string> {
        const result = await this.context.eval(this.code);
        this.#value = result;
        return result;
    }

    public wait(): Promise<string> {
        return this.#promise ??= this.execute();
    }
}
