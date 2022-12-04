import type { Statement } from '../language/index.js';
import type { SubtagSignatureValueParameter } from '../types.js';

export interface SubtagArgument {
    readonly parameter: SubtagSignatureValueParameter;
    readonly isCached: boolean;
    readonly value: string;
    readonly code: Statement;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}
