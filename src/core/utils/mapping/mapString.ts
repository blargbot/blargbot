import { TypeMappingResult } from '@core/types';
import Long from 'long';

import { result } from './result';

export function mapString(value: unknown): TypeMappingResult<string> {
    switch (typeof value) {
        case 'string': return { valid: true, value };
        case 'object': if (!(value instanceof Long)) break;
        // fallthrough
        case 'number':
        case 'bigint': return { valid: true, value: value.toString() };
    }
    return result.never;
}
