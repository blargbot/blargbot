import { Dump } from '../models';

export interface DumpsTable {
    add(dump: Dump): Promise<void>;
    get(id: string): Promise<Dump | undefined>;
}
