import type { BBTagContextFrame } from './BBTagContextFrame.js';
import type { BBTagErrorRenderer } from './BBTagErrorRenderer.js';
import type { BBTagReplacer } from './BBTagReplacer.js';
import type { LocatedBBTagRuntimeError } from './BBTagRuntimeError.js';
import { BBTagRuntimeError, InternalServerError } from './BBTagRuntimeError.js';
import type { BBTagExpression } from './language/BBTagExpression.js';
import type { BBTagSubtag } from './language/BBTagSubtag.js';

export class BBTagContext<out Locals extends object> {
    readonly #callstack: BBTagContextFrame[];
    readonly #locals: object[];
    readonly #replacer: BBTagReplacer<object>;
    readonly #renderError: BBTagErrorRenderer<object>;
    readonly #serialize: (context: BBTagContext<object>) => Awaitable<Uint8Array>;

    public return: number = 0;

    public readonly errors: LocatedBBTagRuntimeError[];

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
        this.#replacer = replacer as BBTagReplacer<object>;
        this.#renderError = renderError as BBTagErrorRenderer<object>;
        this.#serialize = serialize as (context: BBTagContext<object>) => Awaitable<Uint8Array>;
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
                        yield* await this.#replacer.replace(this, name, item);
                    } catch (error) {
                        if (error instanceof RangeError)
                            throw error;
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

    public async addError(error: unknown, bbtag: BBTagSubtag): Promise<string> {
        if (!(error instanceof BBTagRuntimeError))
            return await this.addError(new InternalServerError(error), bbtag);

        this.errors.push({ bbtag, error });
        const values = [];
        for await (const item of await this.#renderError(error, this))
            values.push(item);
        return values.join('');
    }
}
