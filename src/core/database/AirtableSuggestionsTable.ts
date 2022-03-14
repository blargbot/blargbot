import { Logger } from '@blargbot/core/Logger';
import { Suggestion, SuggestionsTable } from '@blargbot/core/types';
import { AirtableBase } from 'airtable/lib/airtable_base';

import { AirtableDbTable } from './base';

export class AirtableSuggestionsTable extends AirtableDbTable<Suggestion> implements SuggestionsTable {
    public constructor(client: AirtableBase, logger: Logger) {
        super(client, 'Suggestions', logger);
    }

    public async get(id: number): Promise<Suggestion | undefined> {
        const record = await this.afind('ID', id);
        return record?.fields;
    }

    public async create(suggestion: Suggestion): Promise<number | undefined> {
        const record = await this.acreate(suggestion);
        return record?.fields.ID;
    }

    public async update(id: number, suggestion: Partial<Suggestion>): Promise<boolean> {
        const record = await this.afind('ID', id);
        if (record === undefined)
            return false;

        return await this.aupdate(record.id, suggestion) !== undefined;
    }
}
