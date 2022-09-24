import { StateManagerCollectionIndex } from './StateManagerCollectionIndex';
import { StateManager, StateManagerCollectionOptions } from './types';

export class StateManagerCollection<TManager extends StateManager<TInit, TState, TUpdate>, TInit = unknown, TState = TInit, TUpdate = TState> implements ReadonlyMap<string, TManager> {
    readonly #options: StateManagerCollectionOptions<TManager, TInit, TState, TUpdate>;
    readonly #managers: Map<string, TManager>;
    readonly #indexes: Record<PropertyKey, Map<unknown, Map<string, TManager>>>;

    public get elementType(): StateManagerCollectionOptions<TManager, TInit, TState, TUpdate>['type'] {
        return this.#options.type;
    }

    public get size(): number {
        return this.#managers.size;
    }

    public [Symbol.iterator](): IterableIterator<[string, TManager]> {
        return this.#managers[Symbol.iterator]();
    }

    public constructor(options: StateManagerCollectionOptions<TManager, TInit, TState, TUpdate>) {
        this.#options = options;
        this.#managers = new Map();
        this.#indexes = {};
        for (const indexName of options.indexes)
            this.#indexes[indexName] = new Map();
    }

    public forEach(callbackfn: (value: TManager, key: string, map: ReadonlyMap<string, TManager>) => void, thisArg?: unknown): void {
        for (const entry of this.#managers)
            callbackfn.call(thisArg, entry[1], entry[0], this);
    }

    public entries(): IterableIterator<[string, TManager]> {
        return this.#managers.entries();
    }

    public values(): IterableIterator<TManager> {
        return this.#managers.values();
    }

    public keys(): IterableIterator<string> {
        return this.#managers.keys();
    }

    public has(id: string): boolean {
        return this.#managers.has(id);
    }

    public get(id: string): TManager {
        const manager = this.#managers.get(id);
        if (manager === undefined)
            throw new Error(`${this.#options.type.name} not found`);
        return manager;
    }

    public tryGet(id: string): TManager | undefined {
        return this.#managers.get(id);
    }

    public create(init: TInit): TManager {
        const manager = this.tryCreate(init);
        if (manager === undefined)
            throw new Error(`${this.#options.type.name} already exists`);
        return manager;
    }

    public upsert(init: TInit & TUpdate): TManager {
        const id = this.#options.getId(init);
        const manager = this.#managers.get(id);
        if (manager === undefined)
            return this.#createCore(id, init);

        manager.update(init);
        return manager;
    }

    public tryCreate(init: TInit): TManager | undefined {
        const id = this.#options.getId(init);
        if (this.#managers.has(id))
            return undefined;
        return this.#createCore(id, init);
    }

    #createCore(id: string, init: TInit): TManager {
        const manager = this.#options.createNew();
        this.#managers.set(id, manager);
        manager.init(init);
        for (const indexName of this.#options.indexes) {
            const value = manager[indexName];
            const indexMap = this.#indexes[indexName];
            let index = indexMap.get(value);
            if (index === undefined)
                indexMap.set(value, index = new Map<string, TManager>());
            index.set(id, manager);
        }
        return manager;
    }

    public delete(id: string): boolean {
        const manager = this.#managers.get(id);
        if (manager !== undefined) {
            for (const indexName of this.#options.indexes)
                this.#indexes[indexName].get(manager[indexName])?.delete(id);
            manager.delete();
        }
        return this.#managers.delete(id);
    }

    public update(update: TUpdate): TManager {
        const manager = this.tryUpdate(update);
        if (manager === undefined)
            throw new Error(`${this.#options.type.name} not found`);
        return manager;
    }

    public tryUpdate(update: TUpdate): TManager | undefined {
        const id = this.#options.getId(update);
        const manager = this.tryGet(id);
        if (manager !== undefined)
            manager.update(update);
        return manager;
    }

    public getIndex<T extends keyof TManager>(key: T, target: TManager[T]): StateManagerCollectionIndex<TManager> {
        const indexMap = this.#indexes[key];
        if (indexMap as (typeof indexMap | undefined) === undefined)
            throw new Error(`Property ${String(key)} of ${this.#options.type.name} is not indexed`);

        let index = indexMap.get(target);
        if (index === undefined)
            indexMap.set(target, index = new Map<string, TManager>());

        return new StateManagerCollectionIndex(this, index, () => {
            indexMap.delete(target);
        });
    }
}
