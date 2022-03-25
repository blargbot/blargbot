import { SubtagLogic } from '../logic';
import { SubtagSignatureDetails } from '../types';

export interface SubtagHandlerCallSignature extends SubtagSignatureDetails {
    readonly hidden?: boolean;
    readonly implementation: SubtagLogic;
}
