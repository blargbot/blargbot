import { StateManagerCollection } from './StateManagerCollection';
import { StateManager } from './types';

export class StateManagerCollectionIndex<TManager extends StateManager<unknown, unknown, unknown>> implements ReadonlyMap<string, TManager> {
    #parentRef?: StateManagerCollection<TManager>;
    #managersRef?: ReadonlyMap<string, TManager>;
    readonly #dispose: () => void;

    get #parent(): StateManagerCollection<TManager> {
        if (this.#parentRef === undefined)
            throw new Error('This collection view has been disposed!');
        return this.#parentRef;
    }

    get #managers(): ReadonlyMap<string, TManager> {
        if (this.#managersRef === undefined)
            throw new Error('This collection view has been disposed!');
        return this.#managersRef;
    }

    public get size(): number {
        return this.#managers.size;
    }

    public constructor(parent: StateManagerCollection<TManager>, data: ReadonlyMap<string, TManager>, dispose: () => void) {
        this.#parentRef = parent;
        this.#managersRef = data;
        this.#dispose = dispose;
    }

    public forEach(callbackfn: (value: TManager, key: string, map: ReadonlyMap<string, TManager>) => void, thisArg?: unknown): void {
        for (const entry of this.#managers)
            callbackfn.call(thisArg, entry[1], entry[0], this);
    }

    public has(key: string): boolean {
        return this.#managers.has(key);
    }

    public entries(): IterableIterator<[string, TManager]> {
        return this.#managers.entries();
    }

    public keys(): IterableIterator<string> {
        return this.#managers.keys();
    }

    public values(): IterableIterator<TManager> {
        return this.#managers.values();
    }

    public [Symbol.iterator](): IterableIterator<[string, TManager]> {
        return this.#managers[Symbol.iterator]();
    }

    public dispose(): void {
        this.#parentRef = undefined;
        this.#managersRef = undefined;
        this.#dispose();
    }

    public get(id: string): TManager {
        const current = this.#managers.get(id);
        if (current === undefined)
            throw new Error(`${this.#parent.elementType.name} not found`);
        return current;
    }

    public tryGet(id: string): TManager | undefined {
        return this.#managers.get(id);
    }

    public clear(): void {
        const toRemove = [...this.#managers.keys()];
        for (const id of toRemove)
            this.#parent.delete(id);
    }
}
