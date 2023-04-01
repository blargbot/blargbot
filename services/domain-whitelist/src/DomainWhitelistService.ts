import type { IKVCache } from '@blargbot/redis-cache';

import type { IDomainWhitelistDatabase } from './IDomainWhitelistDatabase.js';

export class DomainWhitelistService {
    readonly #database: IDomainWhitelistDatabase;
    readonly #cache: IKVCache<string, boolean>;

    public constructor(database: IDomainWhitelistDatabase, cache: IKVCache<string, boolean>) {
        this.#database = database;
        this.#cache = cache;
    }

    public async check(domain: string): Promise<boolean> {
        domain = domain.toLowerCase();
        let result = await this.#cache.get(domain);
        if (result === undefined)
            await this.#cache.set(domain, result = await this.#database.check(domain));

        return result;
    }

    public async set(domain: string, whitelisted: boolean): Promise<void> {
        domain = domain.toLowerCase();
        await this.#database.set(domain, whitelisted);
        await this.#cache.set(domain, whitelisted);
    }
}
