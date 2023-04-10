import type { BBTagRuntime, FindEntityOptions } from '@bbtag/blargbot';
import type { DiscordChoiceQueryMessageBroker } from '@blargbot/discord-choice-query-client';

export class QueryService<Entity> {
    readonly #search: (context: BBTagRuntime, query: string) => Awaitable<readonly string[]>;
    readonly #resolve: (context: BBTagRuntime, id: string) => Awaitable<Entity | undefined>;
    readonly #choose: DiscordChoiceQueryMessageBroker;
    readonly #type: string;
    readonly #alertCancelled: ((context: BBTagRuntime, query: string) => Awaitable<string>);
    readonly #alertFailed: ((context: BBTagRuntime, query: string) => Awaitable<string>);

    public constructor(options: QueryServiceOptions<Entity>) {
        this.#search = options.search;
        this.#resolve = options.resolve;
        this.#choose = options.choose;
        this.#type = options.type;
        this.#alertCancelled = options.alertCancelled;
        this.#alertFailed = options.alertFailed;
    }

    #getCache(context: BBTagRuntime): Record<string, string | undefined | null> {
        return context.queryCache[this.#type];
    }

    async #queryIdSingle(context: BBTagRuntime, query: string, { noLookup, noErrors }: FindEntityOptions): Promise<string | null> {
        noLookup ||= context.scopes.local.quiet === true;
        noErrors ||= context.scopes.local.noLookupErrors === true;

        const choices = await this.#search(context, query);
        switch (choices.length) {
            case 0: return null;
            case 1: return choices[0];
            default: if (noLookup || context.lookupCount >= 5)
                return null;
        }

        const result = await this.#choose.queryChoice({
            channelId: BigInt(context.channel.id),
            userId: BigInt(context.user.id),
            choices: choices,
            query: query,
            timeout: new Date(Date.now() + 5 * 60 * 1000),
            type: this.#type,
            locale: context.locale
        });

        switch (result.type) {
            case 'success': return result.type[0];
            case 'timedOut':
            case 'cancelled': {
                context.lookupCount = Infinity;
                if (!noErrors)
                    await context.messages.create(context, context.channel.id, { content: await this.#alertCancelled(context, query) });
                return null;
            }
            case 'failed': {
                context.lookupCount++;
                if (!noErrors)
                    await context.messages.create(context, context.channel.id, { content: await this.#alertFailed(context, query) });
                return null;
            }
        }
    }

    async #queryIdSingleCached(context: BBTagRuntime, query: string, options: FindEntityOptions): Promise<string | null> {
        const cache = this.#getCache(context);
        const cached = cache[query];
        switch (cached) {
            case null: return null;
            case undefined: return cache[query] = await this.#queryIdSingle(context, query, options);
            default: return cached;
        }
    }

    public async querySingle(context: BBTagRuntime, query: string, options: FindEntityOptions = {}): Promise<Entity | undefined> {
        const id = await this.#queryIdSingleCached(context, query, options);

        if (id === null)
            return undefined;

        return await this.#resolve(context, id);
    }
}

export interface QueryServiceOptions<Entity> {
    readonly search: (context: BBTagRuntime, query: string) => Awaitable<readonly string[]>;
    readonly resolve: (context: BBTagRuntime, id: string) => Awaitable<Entity | undefined>;
    readonly choose: DiscordChoiceQueryMessageBroker;
    readonly type: string;
    readonly alertCancelled: (context: BBTagRuntime, query: string) => Awaitable<string>;
    readonly alertFailed: (context: BBTagRuntime, query: string) => Awaitable<string>;
}
