import { memoize } from '@blargbot/util';

import { BBTagRuntimeError, InternalServerError, SubtagStackOverflowError, UnknownSubtagError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import type { Subtag } from './Subtag.js';
import type { SubtagProvider } from './SubtagProvider.js';
import type { BBTagHooks, BBTagRuntimeRootScope, BBTagRuntimeScope, LocatedRuntimeError, RuntimeDebugEntry } from './types.js';
import { BBTagRuntimeState } from './types.js';

export class BBTagContext {
    readonly #scopes: BBTagRuntimeScope[] = [];
    #local: BBTagRuntimeScope;

    public readonly hooks: BBTagHooks;
    public readonly errors: LocatedRuntimeError[] = [];
    public readonly debug: RuntimeDebugEntry[] = [];
    public readonly root: BBTagRuntimeRootScope;
    public readonly subtags: SubtagProvider;

    public state: BBTagRuntimeState = BBTagRuntimeState.RUNNING;

    public get local(): BBTagRuntimeScope {
        return this.#local;
    }

    public constructor(
        subtags: SubtagProvider,
        hooks: BBTagHooks,
        root: BBTagRuntimeRootScope
    ) {
        this.root = root;
        this.subtags = subtags;
        this.#local = root;
        this.hooks = hooks;
    }

    public enterRecursion(): Disposable {
        if (this.root.recursion.depth >= 200) {
            this.state = BBTagRuntimeState.ABORT;
            throw new SubtagStackOverflowError(this.root.recursion.depth);
        }

        this.root.recursion.depth++;
        return {
            [Symbol.dispose]: memoize(() => this.root.recursion.depth--)
        };
    }

    public enterScope(): Disposable & BBTagRuntimeScope {
        const scope = Object.create(this.#local, {
            [Symbol.dispose]: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: memoize(() => {
                    if (this.#scopes.length === 0)
                        throw new Error('Cannot pop the root scope');
                    this.#scopes.pop();
                    this.#local = this.#scopes.at(-1) ?? this.root;
                })
            }
        });
        this.#scopes.push(scope);
        this.#local = scope;
        return scope;
    }

    public getSubtag(name: string): Subtag {
        return this.subtags.find(name)
            ?? new UnknownSubtagError(name).throw();
    }

    public async eval(bbtag: SubtagCall | BBTagExpression): Promise<string> {
        if (this.state !== BBTagRuntimeState.RUNNING)
            return '';

        const results = 'values' in bbtag
            ? this.#evalStatement(bbtag)
            : this.#evalSubtag(bbtag);

        return await joinResults(results);
    }

    async #evalStatementScoped(bbtag: BBTagExpression): Promise<string> {
        using _scope = this.enterScope();
        return await joinResults(this.#evalStatement(bbtag));
    }

    async * #evalSubtag(bbtag: SubtagCall): AsyncIterable<string> {
        const name = (await this.#evalStatementScoped(bbtag.name)).toLowerCase();

        try {
            const subtag = this.getSubtag(name);
            using _subtag = await this.hooks.subtagExecuting?.(subtag, bbtag);

            try {
                for await (const item of subtag.execute(this, name, bbtag)) {
                    await this.hooks.step?.();

                    if (item !== undefined)
                        yield item;
                }
            } catch (err: unknown) {
                if (err instanceof BBTagRuntimeError) {
                    yield this.addError(err, bbtag);
                } else {
                    await this.hooks.internalServerError?.(err);
                    yield this.addError(new InternalServerError(err), bbtag);
                }
            }

        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            yield this.addError(err, bbtag);
        }

    }

    async * #evalStatement(bbtag: BBTagExpression): AsyncIterable<string> {
        for (const elem of bbtag.values) {
            if (typeof elem === 'string')
                yield elem;
            else {
                yield* this.#evalSubtag(elem);
                if (this.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        }
    }

    public addError(error: BBTagRuntimeError, subtag?: SubtagCall): string {
        this.errors.push({ subtag: subtag, error });
        return error.display ?? this.local.fallback ?? `\`${error.message}\``;
    }
}

async function joinResults(values: AsyncIterable<string>): Promise<string> {
    const results = [];
    for await (const value of values)
        results.push(value);
    return results.join('');
}
