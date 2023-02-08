import type { Suggestion } from '@blargbot/domain/models/index.js';
import type { SuggestionStore } from '@blargbot/domain/stores/index.js';
import type { Logger } from '@blargbot/logger';
import type { AirtableBase } from 'airtable/lib/airtable_base.js';

import { AirtableDbTable } from '../tables/AirtableDbTable.js';

export class AirtableSuggestionStore implements SuggestionStore {
    readonly #table: AirtableDbTable<Suggestion>;

    public constructor(client: AirtableBase, logger: Logger) {
        this.#table = new AirtableDbTable<Suggestion>(client, 'Suggestions', logger);
    }

    public async get(id: number): Promise<Suggestion | undefined> {
        const record = await this.#table.find('ID', id);
        return record?.fields;
    }

    public async create(suggestion: Suggestion): Promise<number | undefined> {
        const record = await this.#table.create(suggestion);
        return record?.fields.ID;
    }

    public async update(id: number, suggestion: Partial<Suggestion>): Promise<boolean> {
        const record = await this.#table.find('ID', id);
        if (record === undefined)
            return false;

        return await this.#table.update(record.id, suggestion) !== undefined;
    }
}
