import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapString(value: unknown): TypeMappingResult<string> {
    return typeof value === 'string'
        ? { valid: true, value }
        : mappingResultNever;
}
