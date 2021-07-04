import { RethinkDb, RethinkDbTable } from './core';
import { GetStoredVar, KnownStoredVars, VarsTable } from './types';
import { Logger } from '../Logger';

export class RethinkDbVarsTable extends RethinkDbTable<'vars'> implements VarsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('vars', rethinkDb, logger);
    }

    public async get<K extends KnownStoredVars['varname']>(key: K): Promise<GetStoredVar<K> | undefined> {
        return <GetStoredVar<K> | undefined>await this.rget(key);
    }

    public async set<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean> {
        return await this.rset(value.varname, value);
    }

    public async delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean> {
        return await this.rdelete(key);
    }
}
