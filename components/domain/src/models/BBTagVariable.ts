import type { TagVariableType } from '@bbtag/blargbot';

export interface BBTagVariable {
    readonly name: string;
    readonly type: TagVariableType;
    readonly scope: string;
    content: string;
}
