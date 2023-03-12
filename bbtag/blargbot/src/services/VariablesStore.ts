import type { TagVariableScope } from '../variables/TagVariableScope.js';

export interface VariablesStore {
    get(scope: TagVariableScope, name: string): Promise<JToken | undefined>;
    set(entries: Iterable<{ scope: TagVariableScope; name: string; value: JToken | undefined; }>): Promise<void>;
}
