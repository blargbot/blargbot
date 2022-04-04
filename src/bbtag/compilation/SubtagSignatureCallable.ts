import { SubtagLogic } from '../logic';
import { SubtagSignatureParameter } from '../types';

export interface SubtagSignatureCallable {
    readonly parameters: readonly SubtagSignatureParameter[];
    readonly implementation: SubtagLogic;
}
