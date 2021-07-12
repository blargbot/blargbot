import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapOptionalBoolean(value: unknown): TypeMappingResult<boolean | undefined> {
    return typeof value === 'boolean'
        ? { valid: true, value }
        : value === null || value === undefined
            ? { valid: true, value: undefined }
            : mappingResultNever;
}
