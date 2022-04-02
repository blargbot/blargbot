import { Suggestion } from '../models';

export interface SuggestionsTable {
    get(id: number): Promise<Suggestion | undefined>;
    create(suggestion: Suggestion): Promise<number | undefined>;
    update(id: number, suggestion: Partial<Suggestion>): Promise<boolean>;
}
