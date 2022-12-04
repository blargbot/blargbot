import type { TagVariableType } from './TagVariableType.js';

export interface BBTagVariable {
    readonly name: string;
    readonly type: TagVariableType;
    readonly scope: string;
    content: string;
}
