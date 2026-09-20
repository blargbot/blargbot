import type { BBTagExpression } from '../../language/index.js';
import type { SubtagSignatureValueParameter } from '../../types.js';

export interface SubtagArgument {
    readonly parameter: SubtagSignatureValueParameter;
    readonly value: string;
    readonly code: BBTagExpression;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}
