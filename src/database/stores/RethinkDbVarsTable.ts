import { GetStoredVar, StoredVar } from '@blargbot/domain/models';
import { VarsTable } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';

import { RethinkDb } from '../clients';
import { RethinkDbTable } from '../tables/RethinkDbTable';

export class RethinkDbVarsTable implements VarsTable {
    #table: RethinkDbTable<StoredVar>;

    public constructor(rethinkDb: RethinkDb, logger: Logger) {
        this.#table = new RethinkDbTable('vars', rethinkDb, logger);
    }

    public async get<K extends StoredVar['varname']>(key: K): Promise<GetStoredVar<K> | undefined>
    public async get(key: string): Promise<StoredVar | undefined> {
        return await this.#table.get(key);
    }

    public async set<K extends StoredVar['varname']>(name: K, value: GetStoredVar<K>): Promise<boolean>
    public async set(name: StoredVar['varname'], value: Omit<StoredVar, 'varname'>): Promise<boolean> {
        return await this.#table.set(name, { varname: name, ...value } as StoredVar);
    }

    public async delete<K extends StoredVar['varname']>(key: K): Promise<boolean> {
        return await this.#table.delete(key);
    }
}
