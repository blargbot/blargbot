import { IFormattable } from '@blargbot/formatting';

import { SubtagSignature } from '../types.js';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureOptions extends Omit<SubtagSignature<IFormattable<string>>, 'parameters'> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
}
