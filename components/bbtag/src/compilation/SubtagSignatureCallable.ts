import type { SubtagLogic } from '../logic/index.js';
import type { SubtagSignatureParameter } from '../types.js';

export interface SubtagSignatureCallable {
    readonly subtagName: string | undefined;
    readonly parameters: readonly SubtagSignatureParameter[];
    readonly implementation: SubtagLogic;
}