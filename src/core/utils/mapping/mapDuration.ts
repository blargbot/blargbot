import { TypeMappingResult } from '@core/types';
import { Duration, duration } from 'moment-timezone';

import { result as _result } from './result';

export function mapDuration(value: unknown): TypeMappingResult<Duration> {
    const result = lazyReadDuration(value);
    if (result?.isValid() === true)
        return { valid: true, value: result };
    return _result.never;
}

function lazyReadDuration(value: unknown): Duration | undefined {
    try {
        switch (typeof value) {
            case 'string': return duration(value);
            case 'object': return duration(value);
            case 'number': return duration(value);
            default: return undefined;
        }
    } catch {
        return undefined;
    }
}
