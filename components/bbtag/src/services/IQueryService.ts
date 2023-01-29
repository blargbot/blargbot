import type { BBTagContext } from '../BBTagContext.js';
import type { FindEntityOptions } from '../types.js';
import type { EntityQueryService } from './EntityQueryService.js';

export type SelectResult<T> =
    | { readonly state: 'NO_OPTIONS' | 'TIMED_OUT' | 'CANCELLED' | 'FAILED'; }
    | { readonly state: 'SUCCESS'; value: T; }

type QueryCache = BBTagContext['data']['query'];
type CacheType = {
    [P in keyof QueryCache as QueryCache[P] extends Record<string, unknown> ? P : never]: QueryCache[P] extends Record<string, infer R> ? NonNullable<R> : never;
}

export interface QueryServiceOptions<State, Key extends keyof CacheType, Result> {
    readonly cacheKey: Key;
    readonly alertNotFound?: (query: string, context: BBTagContext) => Promise<void>;
    readonly alertCancelled?: (query: string, context: BBTagContext) => Promise<void>;
    readonly getById: (id: CacheType[Key], context: BBTagContext) => Awaitable<State | undefined>;
    readonly find: (query: string | undefined, context: BBTagContext) => Awaitable<State[]>;
    readonly pickBest: (choices: State[], query: string, context: BBTagContext) => Promise<SelectResult<State>>;
    readonly getId: (value: State) => CacheType[Key] | undefined;
    readonly getResult: (value: State) => Result;
}

export class FuzzyQueryService<State, Result, Key extends keyof CacheType> implements EntityQueryService<Result> {
    public static cancelled(type: string): (query: string, context: BBTagContext) => Promise<void> {
        return async function cancelled(query, ctx) {
            await ctx.engine.dependencies.services.message.create(ctx, ctx.channel.id, {
                content: `No ${type} matching \`${query}\` found in ${ctx.isCC ? 'custom command' : 'tag'} \`${ctx.rootTagName}\`.`
            });
        };
    }

    public static notFound(type: string): (query: string, context: BBTagContext) => Promise<void> {
        return async function notFound(_, ctx) {
            await ctx.engine.dependencies.services.message.create(ctx, ctx.channel.id, {
                content: `${type} query canceled in ${ctx.isCC ? 'custom command' : 'tag'} \`${ctx.rootTagName}\`.`
            });
        };
    }

    readonly #cacheKey: Key;
    readonly #alertNotFound?: (query: string, context: BBTagContext) => Promise<void>;
    readonly #alertCancelled?: (query: string, context: BBTagContext) => Promise<void>;
    readonly #getById: (id: CacheType[Key], context: BBTagContext) => Awaitable<State | undefined>;
    readonly #find: (query: string | undefined, context: BBTagContext) => Awaitable<State[]>;
    readonly #pickBest: (choices: State[], query: string, context: BBTagContext) => Promise<SelectResult<State>>;
    readonly #getId: (value: State) => CacheType[Key] | undefined;
    readonly #getResult: (value: State) => Result;

    public constructor(options: QueryServiceOptions<State, Key, Result>) {
        this.#cacheKey = options.cacheKey;
        this.#alertNotFound = options.alertNotFound;
        this.#alertCancelled = options.alertCancelled;
        this.#getById = options.getById;
        this.#find = options.find;
        this.#pickBest = options.pickBest;
        this.#getId = options.getId;
        this.#getResult = options.getResult;
    }

    public async get(context: BBTagContext, id: Key): Promise<Result | undefined> {
        const entity = await this.#getById(id, context);
        return entity !== undefined ? this.#getResult(entity) : undefined;
    }

    public async getAll(context: BBTagContext): Promise<Result[]> {
        const entities = await this.#find(undefined, context);
        return entities.map(this.#getResult);
    }

    public async querySingle(context: BBTagContext, query: string, options?: FindEntityOptions): Promise<Result | undefined> {
        const entity = await this.#querySingle(context, query, options);
        return entity !== undefined ? this.#getResult(entity) : undefined;
    }

    #getCache(context: BBTagContext): Record<string, CacheType[Key] | undefined> {
        return context.data.query[this.#cacheKey];
    }

    async #querySingle(context: BBTagContext, query: string, { noLookup, noErrors }: FindEntityOptions = {}): Promise<State | undefined> {
        noLookup ||= context.scopes.local.quiet === true;
        noErrors ||= context.scopes.local.noLookupErrors === true;

        const cache = this.#getCache(context);
        const cached = cache[query];
        if (cached !== undefined)
            return await this.#getById(cached, context);

        const entities = await this.#find(query, context);
        if (entities.length <= 1 || context.data.query.count >= 5 || noLookup) {
            if (entities.length > 1)
                return undefined;

            cache[query] = this.#getId(entities[0]);
            return entities[0];
        }

        const result = await this.#pickBest(entities, query, context);
        switch (result.state) {
            case 'FAILED':
            case 'NO_OPTIONS':
                if (!noErrors && this.#alertNotFound !== undefined) {
                    await this.#alertNotFound(query, context);
                    context.data.query.count++;
                }

                return undefined;
            case 'TIMED_OUT':
            case 'CANCELLED':
                context.data.query.count = Infinity;
                if (!noErrors)
                    await this.#alertCancelled?.(query, context);

                return undefined;
            case 'SUCCESS':
                cache[query] = this.#getId(result.value);
                return result.value;
        }
    }
}
