import { BBTagRuntimeError } from '../errors/BBTagRuntimeError.js';
import { InternalServerError } from '../errors/InternalServerError.js';
import type { BBTagSubtagCall } from '../language/BBTagSubtagCall.js';
import type { BBTagTemplate } from '../language/BBTagTemplate.js';
import { parseBBTag } from '../language/parseBBTag.js';
import { FallbackPlugin } from '../plugins/FallbackPlugin.js';
import { BBTagClosure } from './BBTagClosure.js';
import type { BBTagProcess } from './BBTagProcess.js';
import { BBTagStackFrame } from './BBTagStackFrame.js';
import type { InterruptableAsyncProcess } from './InterruptableProcess.js';

export class BBTagScript extends BBTagClosure implements InterruptableAsyncProcess<string> {
    readonly #closures: BBTagClosure[];
    readonly #stack: BBTagStackFrame[];
    readonly #scripts: BBTagScript[];
    #running: boolean;

    public readonly next: InterruptableAsyncProcess<string>['next'];
    public readonly return: InterruptableAsyncProcess<string>['return'];
    public readonly throw: InterruptableAsyncProcess<string>['throw'];
    public readonly process: BBTagProcess;
    public readonly options: BBTagScriptOptions;
    public readonly stack: Iterable<BBTagStackFrame>;

    public get isRunning(): boolean {
        return this.#running;
    }

    public get currentClosure(): BBTagClosure {
        return this.#closures[this.#closures.length - 1];
    }

    public constructor(process: BBTagProcess, scripts: BBTagScript[], options: BBTagScriptOptions) {
        super(process);
        this.#closures = [this];
        this.#stack = [];
        this.#running = true;
        this.#scripts = scripts;
        this.process = process;
        this.options = options;
        this.stack = {
            [Symbol.iterator]: function* (stack: readonly BBTagStackFrame[]) {
                for (let i = stack.length; i > 0 && i <= stack.length; i--)
                    yield stack[i - 1];
            }.bind(null, this.#stack)
        };
        const result = this.#main();
        this.next = result.next.bind(result);
        this.return = result.return.bind(result);
        this.throw = result.throw.bind(result);
    }

    public [Symbol.asyncIterator](): this {
        return this;
    }

    public truncate(): void {
        this.#running = false;
        const nextScript = this.#scripts.lastIndexOf(this) + 1;
        if (nextScript === 0)
            return;

        for (let i = nextScript; i < this.#scripts.length; i++)
            this.#scripts[i].#running = false;
    }

    public async * runScript(options: BBTagScriptOptions): InterruptableAsyncProcess<string> {
        return yield* new BBTagScript(this.process, this.#scripts, options);
    }

    public async withClosure<T>(action: () => Awaitable<T>): Promise<T> {
        this.#closures.push(new BBTagClosure(this.currentClosure));
        try {
            return await action();
        } finally {
            this.#closures.pop();
        }
    }

    public * withClosureIter<Item, Return, Next>(action: () => FullIterable<Item, Return, Next>): Generator<Item, Return, Next> {
        this.#closures.push(new BBTagClosure(this.currentClosure));
        try {
            return yield* action();
        } finally {
            this.#closures.pop();
        }
    }

    public async * withClosureAsyncIter<Item, Return, Next>(action: () => Awaitable<FullIterable<Item, Return, Next> | FullAsyncIterable<Item, Return, Next>>): AsyncGenerator<Item, Return, Next> {
        this.#closures.push(new BBTagClosure(this.currentClosure));
        try {
            return yield* await action();
        } finally {
            this.#closures.pop();
        }
    }

    async * #main(): InterruptableAsyncProcess<string> {
        const parsed = parseBBTag(this.options.source);
        this.#scripts.push(this);
        try {
            return yield* this.template(parsed);
        } finally {
            this.#scripts.pop();
        }
    }

    public async * template(template: BBTagTemplate): InterruptableAsyncProcess<string> {
        const result = [];
        this.#closures.push(new BBTagClosure());
        try {
            for (const statement of template.statements) {
                const value = typeof statement === 'string'
                    ? statement
                    : yield* this.#invoke(statement);
                result.push(value);
                if (!this.#running)
                    break;
            }
        } finally {
            this.#closures.pop();
        }
        return result.join('');
    }

    async * #invoke(subtag: BBTagSubtagCall): InterruptableAsyncProcess<string> {
        const name = yield* this.template(subtag.name);
        this.#stack.push(new BBTagStackFrame(subtag, name));
        try {
            return yield* this.process.evaluator.execute(name, subtag, this);
        } catch (err) {
            const error = this.#toRuntimeError(err, name, subtag);
            this.process.debug.push(error.toDebug(subtag));
            return error.display ?? this.process.plugins.tryGet(FallbackPlugin)?.fallback ?? error.message;
        } finally {
            this.#stack.pop();
        }
    }

    #toRuntimeError(error: unknown, name: string, subtag: BBTagSubtagCall): BBTagRuntimeError {
        if (error instanceof BBTagRuntimeError)
            return error;

        console.error('Error while executing subtag', { name, source: subtag.source }, error);
        return new InternalServerError(error);
    }
}

export interface BBTagScriptOptions {
    readonly name: string;
    readonly source: string;
    readonly type: string;
    readonly author: string;
    readonly authorizer: string;
    readonly args: string[];
}

export interface FullIterable<Item, Return, Next> {
    [Symbol.iterator](): Iterator<Item, Return, Next>;
}
export interface FullAsyncIterable<Item, Return, Next> {
    [Symbol.asyncIterator](): AsyncIterator<Item, Return, Next>;
}
