import { AirtableTableMap, Suggestor, SuggestorsTable } from '@core/types';

import { AirtableDb } from './base';

export class AirtableSuggestorsTable implements SuggestorsTable {
    public constructor(
        private readonly db: AirtableDb<AirtableTableMap>
    ) {

    }

    public async get(id: string): Promise<Suggestor | undefined> {
        const record = await this.db.get('Suggestors', id);
        return record?.fields;
    }

    public async upsert(userid: string, username: string): Promise<string | undefined> {
        const current = await this.db.find('Suggestors', 'ID', userid);
        if (current === undefined) {
            const created = await this.db.create('Suggestors', {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ID: userid,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                Username: username
            });
            return created?.id;
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        await this.db.update('Suggestors', current.id, { Username: username });

        return current.id;
    }
}
