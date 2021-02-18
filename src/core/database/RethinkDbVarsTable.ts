import { RethinkDb } from './core/RethinkDb';
import { GetStoredVar, KnownStoredVars, VarsTable } from './types';
import { RethinkDbTable, UpdateRequest } from './core/RethinkDbTable';

export class RethinkDbVarsTable extends RethinkDbTable<'vars'> implements VarsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('vars', rethinkDb, logger);
    }

    public async get<K extends KnownStoredVars['varname']>(key: K): Promise<DeepReadOnly<GetStoredVar<K>> | undefined> {
        return <GetStoredVar<K> | undefined>await this.rget(key);
    }

    public async set<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean> {
        return await this.rupdate(value.varname, r => <UpdateRequest<GetStoredVar<K>>>r.literal(value))
            || await this.rinsert(value);
    }

    public async delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean> {
        return await this.rdelete(key);
    }
}