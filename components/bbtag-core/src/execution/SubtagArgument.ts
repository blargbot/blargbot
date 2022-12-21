import type { BBTagTemplate } from '../language/BBTagTemplate.js';
import type { BBTagScript } from '../runtime/BBTagScript.js';
import type { InterruptableAsyncProcess } from '../runtime/InterruptableProcess.js';

export class SubtagArgument {
    readonly #script: BBTagScript;
    #inProgress?: InterruptableAsyncProcess<string>;
    #result: string;

    public readonly template: BBTagTemplate;

    public get isEvaluated(): boolean {
        return this.#inProgress !== undefined;
    }

    public constructor(script: BBTagScript, value: BBTagTemplate) {
        this.#script = script;
        this.template = value;
        this.#result = '';
    }

    public async * value(): InterruptableAsyncProcess<string> {
        yield* this.#inProgress ??= this.#execute();
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
