import type { BBTagScript, InterruptableAsyncProcess } from '@bbtag/engine';
import { ArgumentLengthError } from '@bbtag/engine';
import type { BBTagTemplate } from '@bbtag/language';

export class SubtagArgument {
    readonly #script: BBTagScript;
    #inProgress?: InterruptableAsyncProcess<string>;
    #result: string;

    public readonly index: number;
    public readonly template: BBTagTemplate;

    public get isEvaluated(): boolean {
        return this.#inProgress !== undefined;
    }

    public constructor(script: BBTagScript, index: number, value: BBTagTemplate) {
        this.index = index;
        this.#script = script;
        this.template = value;
        this.#result = '';
    }

    public async * value(maxSize: number): InterruptableAsyncProcess<string> {
        yield* this.#inProgress ??= this.#execute();
        if (this.#result.length > maxSize)
            throw new ArgumentLengthError(this.index, maxSize, this.#result.length);
        return this.#result;
    }

    public async * execute(): InterruptableAsyncProcess<string> {
        return yield* this.#inProgress = this.#execute(this.#inProgress);
    }

    async * #execute(old?: InterruptableAsyncProcess<string>): InterruptableAsyncProcess<string> {
        if (old !== undefined)
            yield* old;

        return this.#result = yield* this.#script.template(this.template);
    }
}
