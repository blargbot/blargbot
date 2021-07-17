import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapOptionalNumber(value: unknown): TypeMappingResult<number | undefined> {
    return typeof value === 'number'
        ? { valid: true, value }
        : value === null || value === undefined
            ? result.undefined
            : result.never;
}
