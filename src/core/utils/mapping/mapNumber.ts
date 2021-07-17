import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapNumber(value: unknown): TypeMappingResult<number> {
    return typeof value === 'number'
        ? { valid: true, value }
        : result.never;
}
