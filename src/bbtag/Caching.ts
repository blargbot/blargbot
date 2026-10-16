import { guard } from '@blargbot/core';
import type { Logger } from '@blargbot/logger';

import type { TagVariableScopeEntry, TagVariableScopeProvider } from './tagVariableScopeProvider.js';

export interface VariableReference {
    readonly key: string;
    get value(): undefined | JToken;
}

export interface VariableCacheHooks {
    readonly commitStarted?: () => Disposable;
    readonly chunkCommitted?: (size: number) => void;
}

interface ValueSource {
    isEqual(other: JToken | undefined): boolean;
    get(): JToken | undefined;
}

export class VariableCache {
    readonly #cache = new Map<string, CacheEntry>();

    public get list(): VariableReference[] {
        return this.#cache
            .values()
            .filter(guard.hasValue)
            .map(v => v.reference)
            .toArray();
    }

    public constructor(
        public readonly scopes: TagVariableScopeProvider,
        public readonly hooks: VariableCacheHooks,
        public readonly logger: Logger
    ) {
    }

    #getCached(variables?: string[]): Iterable<CacheEntry> {
        if (variables === undefined)
            return this.#cache.values().filter(guard.hasValue);
        return variables.map(k => this.#cache.get(k)).filter(guard.hasValue);
    }

    async #getEntry(variable: string): Promise<CacheEntry> {
        const forced = variable.startsWith('!');
        if (forced)
            variable = variable.slice(1);

        let entry = this.#cache.get(variable);
        if (!forced && entry !== undefined)
            return entry;

        const scope = this.scopes.find(variable);
        if (scope === undefined)
            throw new Error('Missing default variable scope!');

        const varName = variable.substring(scope.prefix.length);
        try {
            entry = new CacheEntry(scope, varName, await scope.get(varName));
        } catch (err: unknown) {
            this.logger.error(err, { tagName: this.scopes.tagName, tagVariables: this.scopes.isTag });
            throw err;
        }
        this.#cache.set(variable, entry);
        return entry;
    }

    public async get(variable: string): Promise<VariableReference> {
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
        using _ = this.hooks.commitStarted?.();
        const pools = new Map<TagVariableScopeEntry, Record<string, JToken | undefined>>();
        for (const entry of this.#getCached(variables)) {
            if (!entry.changed)
                continue;

            let pool = pools.get(entry.scope);
            if (pool === undefined)
                pools.set(entry.scope, pool = {});

            pool[entry.key] = entry.value === '' ? undefined : entry.value;
            entry.persist();
        }

        for (const [scope, pool] of pools) {
            const start = performance.now();
            const objectCount = Object.keys(pool).length;
            this.logger.bbtag('Committing', objectCount, 'objects to the', scope.prefix, 'pool.');
            await scope.upsert(pool);
            const elapsed = performance.now() - start;
            this.logger[elapsed > 3000 ? 'info' : 'bbtag']('Commited', objectCount, 'objects to the', scope.prefix, 'pool in', elapsed, 'ms.');
            this.hooks.chunkCommitted?.(objectCount);
        }
    }
}

class CacheEntry {
    #initialValue: ValueSource;
    public value: JToken | undefined;

    public reference: VariableReference;
    public get changed(): boolean { return !this.#initialValue.isEqual(this.value); }

    public constructor(
        public readonly scope: TagVariableScopeEntry,
        public readonly key: string,
        value: JToken | undefined
    ) {
        this.#initialValue = CacheEntry.#captureValue(value);
        this.value = this.#initialValue.get();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const $self = this;
        this.reference = {
            key: $self.scope.prefix + $self.key,
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
