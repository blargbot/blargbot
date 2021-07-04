import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapNumber(value: unknown): TypeMappingResult<number> {
    return typeof value === 'number'
        ? { valid: true, value }
        : mappingResultNever;
}
