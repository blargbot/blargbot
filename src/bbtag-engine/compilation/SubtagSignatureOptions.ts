import type { IFormattable } from '@blargbot/formatting';

import type { SubtagSignature } from '../types.js';
import type { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureOptions extends Omit<SubtagSignature<IFormattable<string>>, 'parameters'> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
}
