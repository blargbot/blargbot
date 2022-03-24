import { SubtagLogic } from '../logic';
import { SubtagSignatureDetails } from '../types';

export interface SubtagHandlerCallSignature extends SubtagSignatureDetails {
    readonly implementation: SubtagLogic;
}
