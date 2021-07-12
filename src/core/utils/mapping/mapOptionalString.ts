import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapOptionalString(value: unknown): TypeMappingResult<string | undefined> {
    return typeof value === 'string'
        ? { valid: true, value }
        : value === null || value === undefined
            ? { valid: true, value: undefined }
            : mappingResultNever;
}
