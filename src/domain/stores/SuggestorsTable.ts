import { Suggestor } from '../models';

export interface SuggestorsTable {
    get(id: string): Promise<Suggestor | undefined>;
    upsert(userid: string, username: string): Promise<string | undefined>;
}
