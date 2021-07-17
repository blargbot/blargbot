import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapOptionalBoolean(value: unknown): TypeMappingResult<boolean | undefined> {
    return typeof value === 'boolean'
        ? { valid: true, value }
        : value === null || value === undefined
            ? result.undefined
            : result.never;
}
