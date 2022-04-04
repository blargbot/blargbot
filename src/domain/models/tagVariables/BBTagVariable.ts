import { SubtagVariableType } from './SubtagVariableType';

export interface BBTagVariable {
    readonly name: string;
    readonly type: SubtagVariableType;
    readonly scope: string;
    content: string;
}
