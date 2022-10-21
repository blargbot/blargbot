import { IFormattable } from '@blargbot/domain/messages/types';

import { SubtagSignature } from '../types';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions';

export interface SubtagSignatureOptions extends Omit<SubtagSignature<IFormattable<string>>, 'parameters'> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
}
