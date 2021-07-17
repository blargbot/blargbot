import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapOptionalString(value: unknown): TypeMappingResult<string | undefined> {
    return typeof value === 'string'
        ? { valid: true, value }
        : value === null || value === undefined
            ? result.undefined
            : result.never;
}
