// eslint-disable-next-line @typescript-eslint/ban-types
export class ScopeManager<T extends object> {
    private readonly scopes: T[];
    private readonly tags: number[];

    public get local(): T { return this.scopes[this.scopes.length - 1]; }
    public get tag(): T { return this.scopes[this.tags[this.tags.length - 1]]; }
    public readonly root: T;

    public constructor(
        private readonly createScope: (parent?: T) => T) {
        this.scopes = [this.root = createScope()];
        this.tags = [0];
    }

    public pushScope(isTag = false): T {
        if (isTag)
            this.tags.push(this.scopes.length);
        this.scopes.push(this.createScope(this.local));
        return this.local;
    }

    public popScope(): T {
        if (this.scopes.length === 1)
            throw new Error('Cannot pop the root scope');
        if (this.tags[this.tags.length - 1] === this.scopes.length)
            this.tags.pop();
        const popped = this.local;
        this.scopes.pop();
        return popped;
    }
}
