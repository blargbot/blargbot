import type { BBTagPluginFactory } from '../plugins/BBTagPluginFactory.js';
import { DefaultFallbackPlugin } from '../plugins/FallbackPlugin.js';
import { DefaultQuietPlugin } from '../plugins/QuietPlugin.js';
import type { SubtagEvaluator } from '../subtags/SubtagEvaluator.js';
import type { BBTagClosureData } from './BBTagClosureData.js';
import { BBTagProcess } from './BBTagProcess.js';
import type { BBTagScriptOptions } from './BBTagScript.js';

export class BBTagRunner {
    readonly #plugins: ReadonlySet<BBTagPluginFactory>;
    readonly #evaluator: SubtagEvaluator;

    public constructor(options: BBTagRunnerOptions) {
        this.#plugins = new Set([
            DefaultQuietPlugin,
            DefaultFallbackPlugin,
            ...options.plugins
        ]);
        this.#evaluator = options.evaluator;
    }

    public async execute(options: BBTagExecuteArgs): Promise<BBTagResult> {
        let step = 0;
        const process = new BBTagProcess({
            script: options.script,
            signal: options.signal,
            plugins: [
                ...this.#plugins,
                ...options.plugins
            ],
            evaluator: this.#evaluator
        });
        let next;
        while ((next = await process.next()).done !== true)
            if (step++ % 10000 === 0)
                await new Promise(res => setImmediate(res));

        return {
            result: next.value,
            data: process.data
        };
    }
}

export interface BBTagRunnerOptions {
    readonly plugins: Iterable<BBTagPluginFactory>;
    readonly evaluator: SubtagEvaluator;
}

export interface BBTagExecuteArgs {
    readonly signal: AbortSignal;
    readonly plugins: Iterable<BBTagPluginFactory>;
    readonly script: BBTagScriptOptions;
}

export interface BBTagResult {
    readonly result: string;
    readonly data: BBTagClosureData;
}
