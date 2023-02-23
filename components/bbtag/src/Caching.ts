import type { TagVariableScope } from '@blargbot/domain/models/index.js';
import { hasValue } from '@blargbot/guards';

import type { BBTagContext } from './BBTagContext.js';
import type { VariablesStore } from './BBTagUtilities.js';
import type { TagVariableScopeProvider } from './tagVariableScopeProviders.js';

export interface VariableReference {
    readonly key: string;
    get value(): undefined | JToken;
}

interface ValueSource {
    isEqual(other: JToken | undefined): boolean;
    get(): JToken | undefined;
}

export class VariableNameParser {
    readonly #scopes: TagVariableScopeProvider[];

    public constructor(scopes: Iterable<TagVariableScopeProvider>) {
        this.#scopes = [...scopes].sort((a, b) => b.prefix.length - a.prefix.length);
    }

    public parse(context: BBTagContext, variable: string): { scope: TagVariableScope; name: string; } {
        const provider = this.#scopes.find(s => variable.startsWith(s.prefix));
        if (provider === undefined)
            throw new Error('Missing default variable scope');

        return {
            scope: provider.getScope(context),
            name: variable.slice(provider.prefix.length)
        };
    }

}

export class BBTagVariableProvider {
    readonly #parser: VariableNameParser;
    readonly #database: VariablesStore;

    public constructor(parser: VariableNameParser, database: VariablesStore) {
        this.#parser = parser;
        this.#database = database;
    }

    public async get(context: BBTagContext, variable: string): Promise<{ scope: TagVariableScope; value: JToken | undefined; }> {
        const { scope, name } = this.#parser.parse(context, variable);
        return { scope, value: await this.#database.get(scope, name) };
    }

    public async set(context: BBTagContext, values: Iterable<{ name: string; value: JToken | undefined; }>): Promise<void> {
        const toSet = Array.from(values, ({ name, value }) => ({ ...this.#parser.parse(context, name), value }));
        if (toSet.length === 0)
            return;

        await this.#database.set(toSet);
    }
}

export class VariableCache {
    readonly #cache: Record<string, CacheEntry | undefined>;
    readonly #provider: BBTagVariableProvider;
    readonly #context: BBTagContext;

    public get list(): VariableReference[] {
        return Object.values(this.#cache)
            .filter(hasValue)
            .map(v => v.reference);
    }

    public constructor(
        context: BBTagContext,
        provider: BBTagVariableProvider
    ) {
        this.#context = context;
        this.#cache = {};
        this.#provider = provider;
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

        const { value } = await this.#provider.get(this.#context, variable);
        return this.#cache[variable] = new CacheEntry(this.#context, variable, value);
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
        const execRunning = this.#context.execTimer.running;
        if (execRunning)
            this.#context.execTimer.end();
        this.#context.dbTimer.resume();
        const updates = this.#getCached(variables)
            .filter(e => e.changed)
            .map(e => {
                e.persist();
                return { name: e.key, value: e.value === '' ? undefined : e.value };
            });
        await this.#provider.set(this.#context, updates);
        this.#context.dbObjectsCommitted += updates.length;
        this.#context.dbTimer.end();
        if (execRunning)
            this.#context.execTimer.resume();
    }
}

class CacheEntry {
    #initialValue: ValueSource;
    public value: JToken | undefined;

    public reference: VariableReference;
    public get changed(): boolean { return !this.#initialValue.isEqual(this.value); }

    public constructor(
        public readonly context: BBTagContext,
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
