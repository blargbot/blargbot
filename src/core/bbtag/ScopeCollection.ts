export interface BBRuntimeScope {
    quiet?: boolean;
    fallback?: string;
    suppressLookup?: boolean;
    reason?: string;
}

export class ScopeCollection {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #scopes: BBRuntimeScope[];

    public get local(): BBRuntimeScope { return this.#scopes[this.#scopes.length - 1]; }

    public constructor() {
        this.#scopes = [{}];
    }

    public get(offset: number): BBRuntimeScope {
        return this.#scopes[this.#scopes.length - 1 - offset];
    }

    public beginScope(): BBRuntimeScope {
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