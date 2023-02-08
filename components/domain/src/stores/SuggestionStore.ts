import type { Suggestion } from '../models/index.js';

export interface SuggestionStore {
    get(id: number): Promise<Suggestion | undefined>;
    create(suggestion: Suggestion): Promise<number | undefined>;
    update(id: number, suggestion: Partial<Suggestion>): Promise<boolean>;
}
