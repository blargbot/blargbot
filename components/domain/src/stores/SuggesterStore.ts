import { Suggester } from '../models/index.js';

export interface SuggesterStore {
    get(id: string): Promise<Suggester | undefined>;
    upsert(userid: string, username: string): Promise<string | undefined>;
}
