import { Timer } from '@core/Timer';
import { guard } from '@core/utils';

import { BBTagContext } from './BBTagContext';
import { TagVariableScope, tagVariableScopes } from './tagVariables';

export class VariableCache {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cache: Record<string, CacheEntry | undefined>;

    public get list(): CacheEntry[] { return Object.values(this.#cache).filter(guard.hasValue); }

    public constructor(
        public readonly context: BBTagContext
    ) {
        this.#cache = {};
    }

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    async #get(variable: string): Promise<CacheEntry> {
        const forced = variable.startsWith('!');
        if (forced)
            variable = variable.slice(1);

        const entry = this.#cache[variable];
        if (!forced && entry !== undefined)
            return entry;

        const scope = tagVariableScopes.find(s => variable.startsWith(s.prefix));
        if (scope === undefined)
            throw new Error('Missing default variable scope!');

        const varName = variable.substring(scope.prefix.length);
        try {
            return this.#cache[variable] = new CacheEntry(this.context, scope, varName, await scope.getter(this.context, varName) ?? '');
        } catch (err: unknown) {
            this.context.logger.error(err, this.context.isCC, this.context.rootTagName);
            throw err;
        }
    }

    public async get(variable: string): Promise<JToken> {
        const entry = await this.#get(variable);
        return entry.value;
    }

    public async set(variable: string, value: JToken): Promise<void> {
        const forced = variable.startsWith('!');
        if (forced)
            variable = variable.slice(1);

        const entry = await this.#get(variable);
        entry.value = value;
        if (forced)
            await this.persist([variable]);
    }

    public async reset(variable: string): Promise<void> {
        const entry = await this.#get(variable);
        entry.reset();
    }

    public async persist(variables?: string[]): Promise<void> {
        const execRunning = this.context.execTimer.running;
        if (execRunning)
            this.context.execTimer.end();
        this.context.dbTimer.resume();
        const vars = (variables?.map(key => this.#cache[key]) ?? Object.values(this.#cache))
            .filter(guard.hasValue);

        const pools = new Map<TagVariableScope, Record<string, JToken>>();
        for (const v of vars) {
            if (!v.changed)
                continue;

            let pool = pools.get(v.scope);
            if (pool === undefined)
                pools.set(v.scope, pool = {});

            pool[v.key] = v.value === '' ? undefined : v.value;
            v.persist();
        }

        for (const [scope, pool] of pools) {
            const timer = new Timer().start();
            const objectCount = Object.keys(pool).length;
            this.context.logger.bbtag('Committing', objectCount, 'objects to the', scope.prefix, 'pool.');
            await scope.setter(this.context, pool);
            timer.end();
            this.context.logger[timer.elapsed > 3000 ? 'info' : 'bbtag']('Commited', objectCount, 'objects to the', scope.prefix, 'pool in', timer.elapsed, 'ms.');
            this.context.dbObjectsCommitted += objectCount;
        }
        this.context.dbTimer.end();
        if (execRunning)
            this.context.execTimer.resume();
    }
}

class CacheEntry {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #signature: string;
    public value: JToken;

    public get changed(): boolean { return this.#signature !== JSON.stringify(this.value); }

    public constructor(
        public readonly context: BBTagContext,
        public readonly scope: TagVariableScope,
        public readonly key: string,
        value: JToken
    ) {
        this.#signature = JSON.stringify(value);
        this.value = value;
    }

    public persist(): void {
        this.#signature = JSON.stringify(this.value);
    }

    public reset(): void {
        this.value = JSON.parse(this.#signature);
    }
}
