import type Discord from '@blargbot/discord-types';
import { DiscordUserCacheHttpClient } from '@blargbot/discord-user-cache-client';

export class CurrentUserAccessor implements ICurrentUserAccessor {
    readonly #client: DiscordUserCacheHttpClient;
    readonly #retryInterval: number;
    readonly #refreshInterval: number;

    #value?: Discord.APIUser;
    #promise?: Promise<Discord.APIUser>;
    #lastLoad: number;

    public constructor(options: CurrentUserAccessorOptions) {
        if (options.client !== undefined)
            this.#client = options.client;
        else if (options.userCacheUrl !== undefined)
            this.#client = new DiscordUserCacheHttpClient(options.userCacheUrl);
        else
            throw new Error('A client or a url must be provided');
        this.#retryInterval = options.retryInterval ?? 1000;
        this.#refreshInterval = options.refreshInterval ?? 60000;
        this.#lastLoad = 0;
    }

    public getOrWait(): Awaitable<Discord.APIUser> {
        if (!this.#shouldReload())
            return this.#value ?? (this.#promise ??= this.#load());

        this.#promise ??= this.#load();
        return this.#value ?? this.#promise;
    }

    public get(): Discord.APIUser {
        if (this.#value === undefined)
            throw new Error('No API user has been retrieved yet!');
        return this.#value;
    }

    #shouldReload(): boolean {
        return this.#lastLoad + this.#refreshInterval < Date.now();
    }

    async #load(): Promise<Discord.APIUser> {
        try {
            const result = this.#value = await this.#retryRequest();
            this.#lastLoad = Date.now();
            return result;
        } finally {
            this.#promise = undefined;
        }
    }

    async #retryRequest(): Promise<Discord.APIUser> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result = await this.#client.getSelf();
            if (result !== undefined)
                return result;

            await new Promise(res => setTimeout(res, this.#retryInterval));
        }
    }
}

export interface CurrentUserAccessorOptions {
    readonly userCacheUrl?: string;
    readonly client?: DiscordUserCacheHttpClient;
    readonly retryInterval?: number;
    readonly refreshInterval?: number;
}

export interface ICurrentUserAccessor {
    getOrWait(): Awaitable<Discord.APIUser>;
    get(): Discord.APIUser;
}
