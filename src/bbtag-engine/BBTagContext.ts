import type { BBTagContextFrame } from './BBTagContextFrame.js';
import type { BBTagEngine } from './BBTagEngine.js';
import type { BBTagRuntimeError } from './BBTagError.js';
import type { BBTagReplaceResult } from './BBTagReplaceResult.js';
import type { BBTagExpression } from './language/BBTagExpression.js';

export class BBTagContext<Locals extends Record<string, unknown>> {
    readonly #engine: BBTagEngine<Record<string, unknown>>;
    readonly #callstack: BBTagContextFrame[];
    readonly #locals: Locals[];

    public readonly errors: BBTagRuntimeError[];

    public get callstack(): readonly BBTagContextFrame[] {
        return Object.freeze(this.#callstack.toReversed());
    }

    public get locals(): Locals {
        return this.#locals.at(-1)!;
    }

    public constructor(locals: Locals, engine: BBTagEngine<Locals>) {
        this.#locals = [locals];
        this.#callstack = [];
        this.errors = [];
        this.#engine = engine as BBTagEngine<Record<string, unknown>>;
    }

    public async eval(bbtag: BBTagExpression): Promise<string> {
        const values = [];
        for await (const item of this.evalIter(bbtag))
            values.push(item);
        return values.join('');
    }

    public async *evalIter(bbtag: BBTagExpression): AsyncGenerator<string> {
        this.#locals.push(Object.create(this.locals));
        try {
            for (const item of bbtag.values) {
                if (typeof item === 'string')
                    yield item;
                else {
                    const name = await this.eval(item.name);

                    this.#callstack.push({ name, subtag: item });
                    try {
                        yield* await this.#engine.replacer(this, name, item);
                    } finally {
                        this.#callstack.pop();
                    }
                }
            }
        } finally {
            this.#locals.pop();
        }
    }

    public async serialize(): Promise<Uint8Array> {
        return await this.#engine.serialize(this);
    }

    public addError(error: BBTagRuntimeError): BBTagReplaceResult {
        this.errors.push(error);
        return this.#engine.renderError(this, error);
    }
}
