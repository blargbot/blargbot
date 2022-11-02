import { SubtagLogic } from '../logic';
import { SubtagSignatureParameter } from '../types';

export interface SubtagSignatureCallable {
    readonly subtagName: string | undefined;
    readonly parameters: readonly SubtagSignatureParameter[];
    readonly implementation: SubtagLogic;
}
