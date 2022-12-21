import type { BBTagScript } from '../../../runtime/BBTagScript.js';
import type { InterruptableAsyncProcess, InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../../SubtagParameter.js';

export default class OptionalParsedParameter<T, F> implements SubtagParameter<T | F> {
    readonly #parse: (value: string, script: BBTagScript) => InterruptableProcess<T | undefined>;
    readonly #fallback: F;

    public readonly minRepeat = 0;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, parse: (value: string, script: BBTagScript) => InterruptableProcess<T | undefined>, fallback: F, maxSize: number) {
        this.#parse = parse;
        this.#fallback = fallback;
        this.values = [{
            name,
            maxSize
        }];
    }

    public async * getValue(_name: string, [value]: SubtagArgument[] | [undefined], script: BBTagScript): InterruptableAsyncProcess<T | F> {
        if (value === undefined)
            return this.#fallback;

        const toParse = yield* value.value();
        const result = yield* this.#parse(toParse, script);
        return result ?? this.#fallback;
    }
}
