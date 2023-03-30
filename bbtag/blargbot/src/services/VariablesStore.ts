import type { BBTagScope } from '../variables/BBTagScope.js';

export interface VariablesStore {
    get(scope: BBTagScope, name: string): Promise<JToken>;
    set(entries: Iterable<{ scope: BBTagScope; name: string; value: JToken; }>): Promise<void>;
}
