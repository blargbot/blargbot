import { TypeMappingResult } from '@core/types';
import Long from 'long';

import { result } from './result';

export function mapString(value: unknown): TypeMappingResult<string> {
    if (typeof value === 'string')
        return { valid: true, value };

    if (typeof value === 'object' && value instanceof Long)
        return { valid: true, value: value.toString() };

    return result.never;
}
