import { TypeMappingResult } from '@core/types';

export function mapUnknown(value: unknown): TypeMappingResult<unknown> {
    return { valid: true, value };
}
