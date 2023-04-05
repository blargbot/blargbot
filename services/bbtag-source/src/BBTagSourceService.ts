import type { BBTagSource, BBTagSourceFilter, BBTagSourceIndex } from '@blargbot/bbtag-source-client';

import type { IBBTagSourceDatabase } from './IBBTagSourceDatabase.js';

export class BBTagSourceService {
    readonly #database: IBBTagSourceDatabase;

    public constructor(database: IBBTagSourceDatabase) {
        this.#database = database;
    }

    public async getSource(key: BBTagSourceIndex): Promise<BBTagSource | undefined> {
        key = this.#checkGlobalTags(key);
        return await this.#database.get(key);
    }

    public async setSource(key: BBTagSourceIndex, value: Partial<BBTagSource>): Promise<boolean> {
        key = this.#checkGlobalTags(key);
        return await this.#database.set(key, value);
    }

    public async deleteSource(filter: BBTagSourceFilter): Promise<void> {
        filter = this.#checkGlobalTags(filter);
        return await this.#database.delete(filter);
    }

    public async alias(alias: BBTagSourceIndex, source: BBTagSourceIndex): Promise<void> {
        alias = this.#checkGlobalTags(alias);
        source = this.#checkGlobalTags(source);
        return await this.#database.alias(alias, source);
    }

    #checkGlobalTags<T extends BBTagSourceFilter>(value: T): T {
        if (!globalTypes.has(value.type))
            return value;

        return { ...value, ownerId: 0n };
    }
}

const globalTypes = new Set(['tag']);
