import { BBTagContext } from '../../BBTagContext';
import { BBTagRuntimeError } from '../../errors';
import { RuntimeLimitRule } from '../../types';

export class UseCountRule implements RuntimeLimitRule {
    readonly #initial: number;
    readonly #type: string;
    readonly #makeError: (subtagName: string) => BBTagRuntimeError;
    #remaining: number;

    public constructor(count: number, type = 'uses', error: string | ((subtagName: string) => BBTagRuntimeError) = 'Usage') {
        this.#initial = count;
        this.#remaining = count;
        this.#type = type;
        this.#makeError = typeof error === 'string'
            ? (subtagName) => new BBTagRuntimeError(`${error} limit reached for {${subtagName}}`)
            : error;
    }

    public check(_context: BBTagContext, subtagName: string): void {
        if (this.#remaining-- <= 0)
            throw this.#makeError(subtagName);
    }

    public displayText(): string {
        return `Maximum ${this.#initial} ${this.#type}`;
    }

    public state(): number {
        return this.#remaining;
    }

    public load(state: JToken): void {
        if (typeof state !== 'number')
            throw new Error(`Invalid state ${JSON.stringify(state)}`);

        this.#remaining = state;
    }
}
