import type { SearchData } from '@blargbot/search-client';

import type { SearchDatabase } from './SearchDatabase.js';

export class SearchService {
    readonly #database: SearchDatabase;

    public constructor(database: SearchDatabase) {
        this.#database = database;
    }

    public async search(scope: string, query: string, types: string[]): Promise<bigint[]> {
        return await this.#database.search(query, types, scope);
    }

    public async set(data: SearchData): Promise<void> {
        await this.#database.set(data);
    }

    public async delete(data: Partial<SearchData>): Promise<void> {
        await this.#database.delete(data);
    }
}
