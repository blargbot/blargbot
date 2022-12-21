import type { BBTagScript } from '../../../runtime/BBTagScript.js';
import type { InterruptableAsyncProcess, InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../../SubtagParameter.js';

export default class ParsedArrayParameter<T> implements SubtagParameter<T[]> {
    readonly #parse: (value: string, script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat: number;
    public readonly maxRepeat: number;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, parse: (value: string, script: BBTagScript) => InterruptableProcess<T>, minRepeat: number, maxRepeat: number, maxSize: number) {
        this.#parse = parse;
        this.maxRepeat = maxRepeat;
        this.minRepeat = minRepeat;
        this.values = [{
            name,
            maxSize
        }];
    }

    public async * getValue(_name: string, values: SubtagArgument[], script: BBTagScript): InterruptableAsyncProcess<T[]> {
        const result: T[] = [];
        for (const value of values) {
            const toParse = yield* value.value();
            result.push(yield* this.#parse(toParse, script));
        }
        return result;
    }
}
