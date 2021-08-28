import { AirtableTableMap, Suggestion, SuggestionsTable } from '@core/types';

import { AirtableDb } from './base';

export class AirtableSuggestionsTable implements SuggestionsTable {
    public constructor(
        private readonly db: AirtableDb<AirtableTableMap>
    ) {
    }

    public async get(id: number): Promise<Suggestion | undefined> {
        const record = await this.db.find('Suggestions', 'ID', id);
        return record?.fields;
    }

    public async create(suggestion: Suggestion): Promise<number | undefined> {
        const record = await this.db.create('Suggestions', suggestion);
        return record?.fields.ID;
    }

    public async update(id: number, suggestion: Partial<Suggestion>): Promise<boolean> {
        const record = await this.db.find('Suggestions', 'ID', id);
        if (record === undefined)
            return false;

        return await this.db.update('Suggestions', record.id, suggestion) !== undefined;
    }
}
