import { Logger } from '@blargbot/core/Logger';
import { GetStoredVar, KnownStoredVars, MutableKnownStoredVars, VarsTable } from '@blargbot/core/types';

import { RethinkDb, RethinkDbTable } from './base';

export class RethinkDbVarsTable extends RethinkDbTable<MutableKnownStoredVars> implements VarsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('vars', rethinkDb, logger);
    }

    public async get<K extends KnownStoredVars['varname']>(key: K): Promise<GetStoredVar<K> | undefined> {
        return <GetStoredVar<K> | undefined>await this.rget(key);
    }

    public async set<K extends KnownStoredVars['varname']>(name: K, value: GetStoredVar<K>): Promise<boolean> {
        const dbVal = <MutableKnownStoredVars><unknown>{ varname: name, ...value };
        return await this.rset(name, dbVal);
    }

    public async delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean> {
        return await this.rdelete(key);
    }
}
