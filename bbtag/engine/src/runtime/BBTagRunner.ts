import type { BBTagClosureData } from '../closure/BBTagClosureData.js';
import type { BBTagPluginManager } from '../index.js';
import { BBTagProcess } from './BBTagProcess.js';
import type { BBTagScriptOptions } from './BBTagScript.js';
import type { SubtagCallEvaluator } from './SubtagCallEvaluator.js';

export class BBTagRunner {
    readonly #plugins: (process: BBTagProcess) => Iterable<object>;
    readonly #evaluator: SubtagCallEvaluator;

    public constructor(options: BBTagRunnerOptions) {
        this.#plugins = options.plugins;
        this.#evaluator = options.evaluator;
    }

    public async execute(options: BBTagExecuteArgs): Promise<BBTagResult> {
        let step = 0;
        const process = new BBTagProcess({
            script: options.script,
            signal: options.signal,
            plugins: p => [
                ...this.#plugins(p),
                ...options.plugins(p)
            ],
            evaluator: this.#evaluator
        });
        let next;
        while ((next = await process.next()).done !== true)
            if (step++ % 10000 === 0)
                await new Promise(res => setImmediate(res));

        return {
            result: next.value,
            data: process.data,
            plugins: process.plugins
        };
    }
}

export interface BBTagRunnerOptions {
    readonly plugins: (process: BBTagProcess) => Iterable<object>;
    readonly evaluator: SubtagCallEvaluator;
}

export interface BBTagExecuteArgs {
    readonly signal: AbortSignal;
    readonly plugins: (process: BBTagProcess) => Iterable<object>;
    readonly script: BBTagScriptOptions;
}

export interface BBTagResult {
    readonly result: string;
    readonly data: BBTagClosureData;
    readonly plugins: BBTagPluginManager;
}
