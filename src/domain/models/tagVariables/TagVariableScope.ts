import { TagVariableType } from './TagVariableType';

export interface TagVariableScope {
    readonly type: TagVariableType;
    readonly entityId?: string;
    readonly name?: string;
}
