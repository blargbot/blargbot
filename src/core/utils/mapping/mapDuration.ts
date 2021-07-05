import { duration, Duration } from 'moment-timezone';
import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapDuration(value: unknown): TypeMappingResult<Duration> {
    const result = lazyReadDuration(value);
    if (result?.isValid() === true)
        return { valid: true, value: result };
    return mappingResultNever;
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
