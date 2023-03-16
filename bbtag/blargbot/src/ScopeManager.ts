import { ContextManager } from './ContextManager.js';
import type { BBTagRuntimeScope } from './types.js';

export class ScopeManager {
    readonly #scopes: BBTagRuntimeScope[];
    readonly #tags: BBTagRuntimeScope[];
    readonly #context: ContextManager<[isTag: boolean], BBTagRuntimeScope>;

    public get local(): BBTagRuntimeScope { return this.#scopes[this.#scopes.length - 1]; }
    public get tag(): BBTagRuntimeScope { return this.#tags[this.#tags.length - 1]; }
    public readonly root: BBTagRuntimeScope;

    public constructor() {
        this.root = {
            inLock: false
        };
        this.#scopes = [this.root];
        this.#tags = [this.root];
        this.#context = new ContextManager({
            enter: isTag => {
                const scope = { ...this.local };
                this.#scopes.push(scope);
                if (isTag)
                    this.#tags.push(scope);
                return scope;
            },
            exit: scope => {
                if (!removeLast(this.#scopes, scope))
                    return;
                removeLast(this.#tags, scope);
            }
        });
    }

    public invoke<T>(action: (scope: BBTagRuntimeScope) => T, isTag = false): T {
        return this.#context.invoke(action, isTag);
    }
}

function removeLast<T>(arr: T[], item: T): boolean {
    const index = arr.lastIndexOf(item);
    if (index < 0)
        return false;
    arr.splice(index, 1);
    return true;
}
