import { TagVariableScope } from '../models';

export interface TagVariableStore {
    upsert(values: Record<string, JToken | undefined>, scope: TagVariableScope): Promise<void>;
    get(name: string, scope: TagVariableScope): Promise<JToken | undefined>;
    clearScope(scope: TagVariableScope): Promise<void>;
}
