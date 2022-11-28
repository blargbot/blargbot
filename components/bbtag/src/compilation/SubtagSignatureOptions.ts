import { IFormattable } from '@blargbot/formatting';

import { SubtagSignature } from '../types';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions';

export interface SubtagSignatureOptions extends Omit<SubtagSignature<IFormattable<string>>, 'parameters'> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
}
