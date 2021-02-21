import { RethinkDb } from './core/RethinkDb';
import { GetStoredVar, KnownStoredVars, VarsTable } from './types';
import { RethinkDbTable } from './core/RethinkDbTable';

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

    public async set<K extends KnownStoredVars['varname']>(key: K, value: Omit<GetStoredVar<K>, 'varname'>): Promise<boolean> {
        return await this.rupdate(key, r => {
            const update: Record<string, unknown> = {
                varname: key
            };
            for (const key of Object.keys(value) as Array<string & keyof typeof value>)
                update[key] = r.literal(value[key]);
            return update;
        }) || await this.rinsert(<GetStoredVar<K>>{ varname: key, ...value });
    }

    public async delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean> {
        return await this.rdelete(key);
    }
}