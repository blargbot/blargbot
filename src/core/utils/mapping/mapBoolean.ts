import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapBoolean(value: unknown): TypeMappingResult<boolean> {
    return typeof value === 'boolean'
        ? { valid: true, value }
        : result.never;
}
