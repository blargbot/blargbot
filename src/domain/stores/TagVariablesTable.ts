import { SubtagVariableType } from '../models';

export interface TagVariablesTable {
    upsert(values: Record<string, JToken | undefined>, type: SubtagVariableType, scope: string): Promise<void>;
    get(name: string, type: SubtagVariableType, scope: string): Promise<JToken | undefined>;
}
