import { TagVariableType } from './TagVariableType';

export interface BBTagVariable {
    readonly name: string;
    readonly type: TagVariableType;
    readonly scope: string;
    content: string;
}
