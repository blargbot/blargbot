import type { TagVariableStore } from '@blargbot/domain/stores/TagVariableStore.js';
import { hasValue } from '@blargbot/guards';
import type { Logger } from '@blargbot/logger';
import { Timer } from '@blargbot/timer';

import type { BBTagContext } from './BBTagContext.js';
import type { TagVariableScopeProvider } from './tagVariableScopeProviders.js';

export interface VariableReference {
    readonly key: string;
    get value(): undefined | JToken;
}

interface ValueSource {
    isEqual(other: JToken | undefined): boolean;
    get(): JToken | undefined;
}

export class VariableCache {
    readonly #cache: Record<string, CacheEntry | undefined>;
    readonly #tagVariables: TagVariableStore;
    readonly #logger: Logger;

    public get list(): VariableReference[] {
        return Object.values(this.#cache)
            .filter(hasValue)
            .map(v => v.reference);
    }

    public constructor(
        public readonly context: BBTagContext,
        public readonly scopeProviders: readonly TagVariableScopeProvider[],
        tagVariables: TagVariableStore,
        logger: Logger
    ) {
        this.#cache = {};
        this.#logger = logger;
        this.#tagVariables = tagVariables;
    }

    #getCached(variables?: string[]): CacheEntry[] {
        if (variables === undefined)
            return Object.values(this.#cache).filter(hasValue);
        return variables.map(k => this.#cache[k]).filter(hasValue);
    }

    async #getEntry(variable: string): Promise<CacheEntry> {
        const forced = variable.startsWith('!');
        if (forced)
            variable = variable.slice(1);

        const entry = this.#cache[variable];
        if (!forced && entry !== undefined)
            return entry;

        const provider = this.scopeProviders.find(s => variable.startsWith(s.prefix));
        if (provider === undefined)
            throw new Error('Missing default variable scope!');

        const varName = variable.substring(provider.prefix.length);
        const scope = provider.getScope(this.context);
        try {
            const value = scope !== undefined ? await this.#tagVariables.get(varName, scope) : undefined;
            return this.#cache[variable] = new CacheEntry(this.context, provider, varName, value);
        } catch (err: unknown) {
            this.#logger.error(err, this.context.isCC, this.context.rootTagName);
            throw err;
        }
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
        const execRunning = this.context.execTimer.running;
        if (execRunning)
            this.context.execTimer.end();
        this.context.dbTimer.resume();
        const pools = new Map<TagVariableScopeProvider, Record<string, JToken | undefined>>();
        for (const entry of this.#getCached(variables)) {
            if (!entry.changed)
                continue;

            let pool = pools.get(entry.scope);
            if (pool === undefined)
                pools.set(entry.scope, pool = {});

            pool[entry.key] = entry.value === '' ? undefined : entry.value;
            entry.persist();
        }

        for (const [provider, pool] of pools) {
            const timer = new Timer().start();
            const objectCount = Object.keys(pool).length;
            this.#logger.bbtag('Committing', objectCount, 'objects to the', provider.prefix, 'pool.');
            const scope = provider.getScope(this.context);
            if (scope !== undefined)
                await this.#tagVariables.upsert(pool, scope);
            timer.end();
            this.#logger[timer.elapsed > 3000 ? 'info' : 'bbtag']('Commited', objectCount, 'objects to the', provider.prefix, 'pool in', timer.elapsed, 'ms.');
            this.context.dbObjectsCommitted += objectCount;
        }
        this.context.dbTimer.end();
        if (execRunning)
            this.context.execTimer.resume();
    }
}

class CacheEntry {
    #initialValue: ValueSource;
    public value: JToken | undefined;

    public reference: VariableReference;
    public get changed(): boolean { return !this.#initialValue.isEqual(this.value); }

    public constructor(
        public readonly context: BBTagContext,
        public readonly scope: TagVariableScopeProvider,
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