import { Logger } from '@blargbot/core/Logger';
import { Suggestor, SuggestorsTable } from '@blargbot/core/types';
import { AirtableBase } from 'airtable/lib/airtable_base';

import { AirtableDbTable } from './base';

export class AirtableSuggestorsTable extends AirtableDbTable<Suggestor> implements SuggestorsTable {
    public constructor(client: AirtableBase, logger: Logger) {
        super(client, 'Suggestors', logger);
    }

    public async get(id: string): Promise<Suggestor | undefined> {
        const record = await this.aget(id);
        return record?.fields;
    }

    public async upsert(userid: string, username: string): Promise<string | undefined> {
        const current = await this.afind('ID', userid);
        if (current === undefined) {
            const created = await this.acreate({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ID: userid,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                Username: username
            });
            return created?.id;
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        await this.aupdate(current.id, { Username: username });

        return current.id;
    }
}
