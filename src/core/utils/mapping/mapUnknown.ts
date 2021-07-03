import { TypeMappingResult } from '../../../workers/image/core';

export function mapUnknown(value: unknown): TypeMappingResult<unknown> {
    return { valid: true, value };
}
