import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapBoolean(value: unknown): TypeMappingResult<boolean> {
    return typeof value === 'boolean'
        ? { valid: true, value }
        : mappingResultNever;
}
