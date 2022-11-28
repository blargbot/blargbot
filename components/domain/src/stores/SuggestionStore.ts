import { Suggestion } from '../models';

export interface SuggestionStore {
    get(id: number): Promise<Suggestion | undefined>;
    create(suggestion: Suggestion): Promise<number | undefined>;
    update(id: number, suggestion: Partial<Suggestion>): Promise<boolean>;
}
