import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapOptionalBoolean(value: unknown): TypeMappingResult<boolean | undefined> {
    return typeof value === 'boolean' || value === undefined
        ? { valid: true, value }
        : mappingResultNever;
}
