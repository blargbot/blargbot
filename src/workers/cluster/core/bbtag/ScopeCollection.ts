import { BBTagRuntimeScope } from '../types';

export class ScopeCollection {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #scopes: BBTagRuntimeScope[];

    public get local(): BBTagRuntimeScope { return this.#scopes[this.#scopes.length - 1]; }

    public constructor() {
        this.#scopes = [{}];
    }

    public get(offset: number): BBTagRuntimeScope {
        return this.#scopes[this.#scopes.length - 1 - offset];
    }

    public beginScope(): BBTagRuntimeScope {
        const scope = Object.create(this.local);
        this.#scopes.push(scope);
        return scope;
    }

    public finishScope(): void {
        if (this.#scopes.length === 1)
            throw new Error('Cannot remove root scope');
        this.#scopes.pop();
    }
}
