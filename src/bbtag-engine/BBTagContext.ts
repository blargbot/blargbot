import type { BBTagAnyLocal } from './BBTagAnyLocal.js';
import type { BBTagContextFrame } from './BBTagContextFrame.js';
import type { BBTagErrorRenderer } from './BBTagErrorRenderer.js';
import type { BBTagReplacer } from './BBTagReplacer.js';
import { BBTagRuntimeError, InternalServerError } from './BBTagRuntimeError.js';
import type { BBTagExpression } from './language/BBTagExpression.js';
import type { BBTagSubtag } from './language/BBTagSubtag.js';

export class BBTagContext<out Locals extends Record<string, unknown>> {
    readonly #callstack: BBTagContextFrame[];
    readonly #locals: BBTagAnyLocal[];
    readonly #replacer: BBTagReplacer<BBTagAnyLocal>;
    readonly #renderError: BBTagErrorRenderer<BBTagAnyLocal>;
    readonly #serialize: (context: BBTagContext<BBTagAnyLocal>) => Awaitable<Uint8Array>;

    public return: number = 0;

    public readonly errors: Array<{ readonly subtag: BBTagSubtag; readonly error: BBTagRuntimeError; }>;

    public get callstack(): readonly BBTagContextFrame[] {
        return Object.freeze(this.#callstack.toReversed());
    }

    public get locals(): Locals {
        return this.#locals.at(-1) as Locals;
    }

    public constructor(
        locals: Locals,
        replacer: BBTagReplacer<Locals>,
        renderError: BBTagErrorRenderer<Locals>,
        serialize: (context: BBTagContext<Locals>) => Awaitable<Uint8Array>
    ) {
        this.#locals = [locals];
        this.#replacer = replacer as BBTagReplacer<BBTagAnyLocal>;
        this.#renderError = renderError as BBTagErrorRenderer<BBTagAnyLocal>;
        this.#serialize = serialize as (context: BBTagContext<BBTagAnyLocal>) => Awaitable<Uint8Array>;
        this.#callstack = [];
        this.errors = [];
    }

    public async eval(bbtag: BBTagExpression): Promise<string> {
        if (this.return !== 0)
            return '';

        const values = [];
        for await (const item of this.evalIter(bbtag))
            values.push(item);
        return values.join('');
    }

    public async *evalIter(bbtag: BBTagExpression): AsyncGenerator<string> {
        this.#locals.push(Object.create(this.locals));
        try {
            for (const item of bbtag.values) {
                if (typeof item === 'string') {
                    yield item;
                } else {
                    const name = await this.eval(item.name);

                    this.#callstack.push({ name, subtag: item });
                    try {
                        yield* await this.#replacer(this, name, item);
                    } catch (error) {
                        yield await this.addError(error, item);
                    } finally {
                        this.#callstack.pop();
                    }
                    if (this.return !== 0)
                        return;
                }
            }
        } finally {
            this.#locals.pop();
        }
    }

    public pushScope(): Disposable {
        this.#locals.push(Object.create(this.locals));
        let disposed = false;
        return {
            [Symbol.dispose]: () => {
                if (disposed)
                    return;
                disposed = true;
                this.#locals.pop();
            }
        };
    }

    public async serialize(): Promise<Uint8Array> {
        return await this.#serialize(this);
    }

    public async addError(error: unknown, subtag: BBTagSubtag): Promise<string> {
        if (!(error instanceof BBTagRuntimeError))
            return await this.addError(new InternalServerError(error), subtag);

        this.errors.push({ subtag, error });
        const values = [];
        for await (const item of await this.#renderError(error, this))
            values.push(item);
        return values.join('');
    }
}
