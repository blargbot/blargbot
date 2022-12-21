import type { BBTagScript } from '../../../runtime/BBTagScript.js';
import type { InterruptableAsyncProcess, InterruptableProcess } from '../../../runtime/InterruptableProcess.js';
import type { SubtagArgument } from '../../SubtagArgument.js';
import type { SubtagParameter, SubtagParameterDetails } from '../../SubtagParameter.js';

export default class ParsedParameter<T> implements SubtagParameter<T> {
    readonly #parse: (value: string, script: BBTagScript) => InterruptableProcess<T>;

    public readonly minRepeat = 1;
    public readonly maxRepeat = 1;
    public readonly values: SubtagParameterDetails[];

    public constructor(name: string, parse: (value: string, script: BBTagScript) => InterruptableProcess<T>, maxSize: number) {
        this.#parse = parse;
        this.values = [{
            name,
            maxSize
        }];
    }

    public async * getValue(_name: string, [value]: SubtagArgument[], script: BBTagScript): InterruptableAsyncProcess<T> {
        const toParse = yield* value.value();
        return yield* this.#parse(toParse, script);
    }
}
