import { GetStoredVar, StoredVar } from '../models';

export interface VarsTable {
    set<K extends StoredVar['varname']>(name: K, value: GetStoredVar<K> | undefined): Promise<boolean>;
    get<K extends StoredVar['varname']>(key: K): Promise<GetStoredVar<K> | undefined>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<boolean>;
}
