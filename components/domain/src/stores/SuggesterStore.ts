import { Suggester } from '../models';

export interface SuggesterStore {
    get(id: string): Promise<Suggester | undefined>;
    upsert(userid: string, username: string): Promise<string | undefined>;
}
