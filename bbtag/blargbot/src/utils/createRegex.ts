import { BBTagRuntimeError } from '../errors/index.js';
import type { BBTagValueConverter } from './valueConverter.js';

export function createRegex(converter: BBTagValueConverter, regexStr: string): RegExp {
    const regexResult = converter.regex(regexStr);
    if (regexResult.success)
        return regexResult.value;
    switch (regexResult.reason) {
        case 'invalid': throw new BBTagRuntimeError('Invalid Regex');
        case 'tooLong': throw new BBTagRuntimeError('Regex too long');
        case 'unsafe': throw new BBTagRuntimeError('Unsafe Regex');
    }
}
