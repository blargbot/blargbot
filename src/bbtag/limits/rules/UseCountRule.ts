import { IFormattable } from '@blargbot/formatting';
import { mapping } from '@blargbot/mapping';

import { BBTagContext } from '../../BBTagContext';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

export class UseCountRule implements RuntimeLimitRule {
    readonly #errorMessage: IFormattable<string>;
    readonly #makeError: (subtagName: string) => BBTagRuntimeError;
    #initial: number;
    #remaining: number;

    public constructor(
        count: number,
        errorMessage: IFormattable<string> | ((value: { count: number; }) => IFormattable<string>) = templates.limits.rules.useCount.default,
        error: string | ((subtagName: string) => BBTagRuntimeError) = 'Usage'
    ) {
        this.#initial = count;
        this.#remaining = count;
        this.#errorMessage = typeof errorMessage === 'function' ? errorMessage({ count }) : errorMessage;
        this.#makeError = typeof error === 'string'
            ? (subtagName) => new BBTagRuntimeError(`${error} limit reached for ${subtagName}`)
            : error;
    }

    public check(_context: BBTagContext, subtagName: string): void {
        if (this.#remaining-- <= 0)
            throw this.#makeError(subtagName);
    }

    public displayText(): IFormattable<string> {
        return this.#errorMessage;
    }

    public state(): [number, number] {
        return [this.#remaining, this.#initial];
    }

    public load(state: JToken): void {
        const mapped = mapState(state);
        if (!mapped.valid)
            throw new Error(`Invalid state ${JSON.stringify(state)}`);

        this.#remaining = mapped.value[0];
        this.#initial = mapped.value[1];
    }
}

const mapState = mapping.tuple<[number, number]>([
    mapping.number,
    mapping.number
]);
