import { BBTagRuntimeScope } from '@cluster/types';

// eslint-disable-next-line @typescript-eslint/ban-types
export class ScopeManager {
    private readonly scopes: BBTagRuntimeScope[];
    private readonly tags: number[];

    public get local(): BBTagRuntimeScope { return this.scopes[this.scopes.length - 1]; }
    public get tag(): BBTagRuntimeScope { return this.scopes[this.tags[this.tags.length - 1]]; }
    public readonly root: BBTagRuntimeScope;

    public constructor() {
        this.scopes = [this.root = {
            functions: {},
            inLock: false
        }];
        this.tags = [0];
    }

    public pushScope(isTag = false): BBTagRuntimeScope {
        if (isTag)
            this.tags.push(this.scopes.length);
        this.scopes.push({ ...this.local });
        return this.local;
    }

    public popScope(): BBTagRuntimeScope {
        if (this.scopes.length === 1)
            throw new Error('Cannot pop the root scope');
        if (this.tags[this.tags.length - 1] === this.scopes.length)
            this.tags.pop();
        const popped = this.local;
        this.scopes.pop();
        return popped;
    }
}
