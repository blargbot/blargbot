import { Timer } from '@core/Timer';

import { BBTagContext } from './BBTagContext';
import { tagVariableScopes } from './tagVariables';

export class CacheEntry {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #original: JToken;
    public value: JToken;

    public get changed(): boolean { return this.#original !== this.value; }

    public constructor(
        public readonly context: BBTagContext,
        public readonly key: string,
        original: JToken
    ) {
        this.#original = original;
        this.value = original;
    }

    public persist(): void {
        this.#original = this.value;
    }

    public reset(): void {
        this.value = this.#original;
    }
}

export class VariableCache {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cache: Record<string, CacheEntry | undefined>;

    public get list(): CacheEntry[] { return Object.keys(this.#cache).map(k => this.#cache[k]).filter((e): e is CacheEntry => e !== undefined); }

    public constructor(
        public readonly context: BBTagContext
    ) {
        this.#cache = {};
    }

    private async _get(variable: string): Promise<CacheEntry> {
        const forced = variable.startsWith('!');
        if (forced) variable = variable.substr(1);
        const entry = this.#cache[variable];
        if (!forced && entry !== undefined)
            return entry;

        const scope = tagVariableScopes.find(s => variable.startsWith(s.prefix));
        if (scope === undefined)
            throw new Error('Missing default variable scope!');
        try {
            return this.#cache[variable] = new CacheEntry(this.context, variable,
                await scope.getter(this.context, variable.substring(scope.prefix.length)) ?? '');
        } catch (err: unknown) {
            this.context.logger.error(err, this.context.isCC, this.context.rootTagName);
            throw err;
        }
    }

    public async get(variable: string): Promise<JToken> {
        const entry = await this._get(variable);
        return entry.value;
    }

    public async set(variable: string, value: JToken | CacheEntry): Promise<void> {
        if (value instanceof CacheEntry) {
            this.#cache[variable] = value;
            return;
        }

        const forced = variable.startsWith('!');
        if (forced) variable = variable.substr(1);
        const entry = await this._get(variable);
        entry.value = value;
        if (forced)
            await this.persist([variable]);
    }

    public async reset(variable: string): Promise<void> {
        const entry = await this._get(variable);
        entry.reset();
    }

    public async persist(variables?: string[]): Promise<void> {
        const execRunning = this.context.execTimer.running;
        if (execRunning)
            this.context.execTimer.end();
        this.context.dbTimer.resume();
        const vars = (variables ?? Object.keys(this.#cache))
            .map(key => this.#cache[key])
            .filter((c): c is CacheEntry => c !== undefined);
        const pools: Record<string, Record<string, JToken>> = {};
        for (const v of vars) {
            if (v.changed) {
                const scope = tagVariableScopes.find(s => v.key.startsWith(s.prefix));
                if (scope === undefined) throw new Error('Missing default variable scope!');
                const pool = pools[scope.prefix] ??= {};
                pool[v.key.substring(scope.prefix.length)] = v.value === '' ? undefined : v.value;
                v.persist();
            }
        }
        for (const [key, pool] of Object.entries(pools)) {
            const timer = new Timer().start();
            const scope = tagVariableScopes.find(s => key === s.prefix);
            if (scope === undefined)
                throw new Error('Missing default variable scope!');
            const objectCount = Object.keys(pool).length;
            this.context.logger.bbtag('Committing', objectCount, 'objects to the', key, 'pool.');
            await scope.setter(this.context, pool);
            timer.end();
            this.context.logger[timer.elapsed > 3000 ? 'info' : 'bbtag']('Commited', objectCount, 'objects to the', key, 'pool in', timer.elapsed, 'ms.');
            this.context.dbObjectsCommitted += objectCount;
        }
        this.context.dbTimer.end();
        if (execRunning)
            this.context.execTimer.resume();
    }
}
