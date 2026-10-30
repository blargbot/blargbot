import type { TagVariableScope, TagVariableScopeFilter } from '../models/index.js';

export interface TagVariableStore {
    upsert(values: JObject, scope: TagVariableScope): Promise<void>;
    get(name: string, scope: TagVariableScope): Promise<JToken | undefined>;
    getScope(scope: TagVariableScopeFilter): Promise<Array<{ scope: TagVariableScope; name: string; value: JToken; }>>;
    clearScope(scope: TagVariableScopeFilter): Promise<void>;
}
