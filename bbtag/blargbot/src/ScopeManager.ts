import type { BBTagRuntimeScope } from './types.js';

export class ScopeManager {
    readonly #scopes: BBTagRuntimeScope[];
    readonly #tags: number[];

    public get local(): BBTagRuntimeScope { return this.#scopes[this.#scopes.length - 1]; }
    public get tag(): BBTagRuntimeScope { return this.#scopes[this.#tags[this.#tags.length - 1]]; }
    public readonly root: BBTagRuntimeScope;

    public constructor() {
        this.#scopes = [this.root = {
            functions: {},
            inLock: false,
            isTag: false
        }];
        this.#tags = [0];
    }

    public withScope<T>(action: (scope: BBTagRuntimeScope) => T, isTag = false): T {
        const scope = this.#pushScope(isTag);
        const result = action(scope);
        if (result instanceof Promise)
            result.finally(() => this.#popScope());
        else
            this.#popScope();
        return result;
    }

    #pushScope(isTag = false): BBTagRuntimeScope {
        if (isTag)
            this.#tags.push(this.#scopes.length);
        this.#scopes.push({ ...this.local, isTag });
        return this.local;
    }

    #popScope(): BBTagRuntimeScope {
        if (this.#scopes.length === 1)
            throw new Error('Cannot pop the root scope');
        const popped = this.local;
        this.#scopes.pop();
        if (popped.isTag)
            this.#tags.pop();
        return popped;
    }
}
