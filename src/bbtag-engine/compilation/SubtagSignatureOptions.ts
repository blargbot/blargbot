import type { SubtagSignature } from '../types.js';
import type { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureOptions extends Omit<SubtagSignature, 'parameters'> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
}
