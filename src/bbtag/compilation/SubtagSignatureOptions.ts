import { SubtagSignature } from '../types';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions';

export interface SubtagSignatureOptions extends Omit<SubtagSignature, `parameters`> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
}
