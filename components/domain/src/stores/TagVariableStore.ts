import type { TagVariableScope, TagVariableScopeFilter } from '../models/index.js';

export interface TagVariableStore {
    upsert(entries: Iterable<{ name: string; scope: TagVariableScope; value: JToken | undefined; }>): Promise<void>;
    get(name: string, scope: TagVariableScope): Promise<JToken | undefined>;
    getScope(scope: TagVariableScopeFilter): Promise<Array<{ scope: TagVariableScope; name: string; value: JToken; }>>;
    clearScope(scope: TagVariableScopeFilter): Promise<void>;
}
