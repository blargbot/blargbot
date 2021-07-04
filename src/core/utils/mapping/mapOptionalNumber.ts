import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapOptionalNumber(value: unknown): TypeMappingResult<number | undefined> {
    return typeof value === 'number' || value === undefined
        ? { valid: true, value }
        : mappingResultNever;
}
