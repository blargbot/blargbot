import { Dump } from '../models';

export interface DumpStore {
    add(dump: Dump): Promise<void>;
    get(id: string): Promise<Dump | undefined>;
}
