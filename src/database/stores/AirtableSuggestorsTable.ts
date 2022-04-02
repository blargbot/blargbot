import { Suggestor } from '@blargbot/domain/models';
import { SuggestorsTable } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import { AirtableBase } from 'airtable/lib/airtable_base';

import { AirtableDbTable } from '../tables/AirtableDbTable';

export class AirtableSuggestorsTable implements SuggestorsTable {
    readonly #table: AirtableDbTable<Suggestor>;

    public constructor(client: AirtableBase, logger: Logger) {
        this.#table = new AirtableDbTable<Suggestor>(client, 'Suggestors', logger);
    }

    public async get(id: string): Promise<Suggestor | undefined> {
        const record = await this.#table.get(id);
        return record?.fields;
    }

    public async upsert(userid: string, username: string): Promise<string | undefined> {
        const current = await this.#table.find('ID', userid);
        if (current === undefined) {
            const created = await this.#table.create({
                ID: userid,
                Username: username
            });
            return created?.id;
        }

        await this.#table.update(current.id, { Username: username });

        return current.id;
    }
}
