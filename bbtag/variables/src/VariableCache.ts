import { hasValue } from '@blargbot/guards';

import type { IVariableProvider } from './VariableProvider.js';
import type { IVariableReference } from './VariableReference.js';

export interface IVariableCache {
    cached: IVariableReference[];
    get(variable: string): Awaitable<IVariableReference>;
    set(variable: string, value: JToken | undefined): Awaitable<void>;
    reset(variables?: string[]): void;
    persist(variables?: string[]): Awaitable<void>;
}

export class VariableCache<Context, Scope> implements IVariableCache {
    readonly #cache: Record<string, CacheEntry<Context> | undefined>;
    readonly #provider: IVariableProvider<Context, Scope>;
    readonly #context: Context;

    public get cached(): IVariableReference[] {
        return Object.values(this.#cache)
            .filter(hasValue)
            .map(v => v.reference);
    }

    public constructor(
        context: Context,
        provider: IVariableProvider<Context, Scope>
    ) {
        this.#context = context;
        this.#cache = {};
        this.#provider = provider;
    }

    #getCached(variables?: string[]): Array<CacheEntry<Context>> {
        if (variables === undefined)
            return Object.values(this.#cache).filter(hasValue);
        return variables.map(k => this.#cache[k]).filter(hasValue);
    }

    async #getEntry(variable: string): Promise<CacheEntry<Context>> {
        const forced = variable.startsWith('!');
        if (forced)
            variable = variable.slice(1);

        const entry = this.#cache[variable];
        if (!forced && entry !== undefined)
            return entry;

        const { value } = await this.#provider.get(this.#context, variable);
        return this.#cache[variable] = new CacheEntry(this.#context, variable, value);
    }

    public async get(variable: string): Promise<IVariableReference> {
        const result = await this.#getEntry(variable);
        return result.reference;
    }

    public async set(variable: string, value: JToken | undefined): Promise<void> {
        const forced = variable.startsWith('!');
        if (forced)
            variable = variable.slice(1);

        const entry = await this.#getEntry(variable);
        entry.value = value;
        if (forced)
            await this.persist([variable]);
    }

    public reset(variables?: string[]): void {
        for (const entry of this.#getCached(variables))
            entry.reset();
    }

    public async persist(variables?: string[]): Promise<void> {
        const updates = this.#getCached(variables)
            .filter(e => e.changed)
            .map(e => {
                e.persist();
                return { name: e.key, value: e.value === '' ? undefined : e.value };
            });
        await this.#provider.set(this.#context, updates);
    }
}

class CacheEntry<Context> {
    #initialValue: ValueSource;
    public value: JToken | undefined;

    public reference: IVariableReference;
    public get changed(): boolean { return !this.#initialValue.isEqual(this.value); }

    public constructor(
        public readonly context: Context,
        public readonly key: string,
        value: JToken | undefined
    ) {
        this.#initialValue = CacheEntry.#captureValue(value);
        this.value = this.#initialValue.get();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const $self = this;
        this.reference = {
            key: this.key,
            get value() { return $self.value; }
        };
    }

    public persist(): void {
        this.#initialValue = CacheEntry.#captureValue(this.value);
    }

    public reset(): void {
        this.value = this.#initialValue.get();
    }

    static #captureValue(value: undefined | JToken): ValueSource {
        if (typeof value !== 'object' || value === null) {
            return {
                isEqual: current => current === value,
                get: () => value
            };
        }

        const jdata = JSON.stringify(value);
        return {
            isEqual: current => typeof current === 'object' && JSON.stringify(current) === jdata,
            get: () => JSON.parse(jdata)
        };
    }
}

interface ValueSource {
    isEqual(other: JToken | undefined): boolean;
    get(): JToken | undefined;
}
