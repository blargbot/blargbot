import Long from 'long';
import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapString(value: unknown): TypeMappingResult<string> {
    if (typeof value === 'string')
        return { valid: true, value };

    if (typeof value === 'object' && value instanceof Long)
        return { valid: true, value: value.toString() };

    return mappingResultNever;
}
