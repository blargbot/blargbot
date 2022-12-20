import type { SourceMarker } from '../language/SourceMarker.js';
import type { BBTagPluginFactory } from '../plugins/BBTagPluginFactory.js';
import { BBTagPluginManager } from '../plugins/BBTagPluginManager.js';
import type { SubtagEvaluator } from '../subtags/SubtagEvaluator.js';
import { BBTagClosure } from './BBTagClosure.js';
import type { BBTagClosureValue } from './BBTagClosureValue.js';
import type { BBTagScriptOptions } from './BBTagScript.js';
import { BBTagScript } from './BBTagScript.js';
import type { InterruptableAsyncProcess } from './InterruptableProcess.js';

export class BBTagProcess extends BBTagClosure implements InterruptableAsyncProcess<string> {
    readonly #scripts: BBTagScript[];
    public readonly next: InterruptableAsyncProcess<string>['next'];
    public readonly return: InterruptableAsyncProcess<string>['return'];
    public readonly throw: InterruptableAsyncProcess<string>['throw'];
    public readonly evaluator: SubtagEvaluator;
    public readonly mainScript: BBTagScript;
    public readonly plugins: BBTagPluginManager;
    public readonly debug: BBTagDebugMessage[];
    public readonly signal: AbortSignal;

    public get currentClosure(): BBTagClosure {
        return this.currentScript.currentClosure;
    }

    public get currentScript(): BBTagScript {
        return this.#scripts[this.#scripts.length - 1] ?? this.mainScript;
    }

    public constructor(options: BBTagRuntimeArgs) {
        super();
        this.data.load(options.initialData ?? {});

        this.#scripts = [];
        this.debug = [];
        this.signal = options.signal;
        this.evaluator = options.evaluator;
        this.mainScript = new BBTagScript(this, this.#scripts, options.script);

        const result = this.#runScript();
        this.next = result.next.bind(result);
        this.return = result.return.bind(result);
        this.throw = result.throw.bind(result);

        this.plugins = new BBTagPluginManager(this, options.plugins);
    }

    public [Symbol.asyncIterator](): this {
        return this;
    }

    async * #runScript(): InterruptableAsyncProcess<string> {
        let next;
        do {
            this.throwIfAborted();
            yield;
        } while ((next = await this.mainScript.next()).done !== true);
        return next.value;
    }

    public throwIfAborted(): void {
        if (this.signal.aborted)
            throw new Error('Abort requested before execution completed');
    }
}

export interface BBTagRuntimeArgs {
    readonly signal: AbortSignal;
    readonly plugins: Iterable<BBTagPluginFactory>;
    readonly script: BBTagScriptOptions;
    readonly evaluator: SubtagEvaluator;
    readonly initialData?: Record<string, BBTagClosureValue>;
}

export interface BBTagDebugMessage {
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly message: string;
    readonly detail?: unknown;
}
