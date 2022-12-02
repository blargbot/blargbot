import { Dump } from '../models/index.js';

export interface DumpStore {
    add(dump: Dump): Promise<void>;
    get(id: string): Promise<Dump | undefined>;
}
