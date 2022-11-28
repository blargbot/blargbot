import { TagVariableScope, TagVariableScopeFilter } from '../models';

export interface TagVariableStore {
    upsert(values: Record<string, JToken | undefined>, scope: TagVariableScope): Promise<void>;
    get(name: string, scope: TagVariableScope): Promise<JToken | undefined>;
    getScope(scope: TagVariableScopeFilter): Promise<Array<{ scope: TagVariableScope; name: string; value: JToken; }>>;
    clearScope(scope: TagVariableScopeFilter): Promise<void>;
}
