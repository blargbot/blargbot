import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapInstanceof<T>(type: new (...args: unknown[]) => T): TypeMapping<T> {
    return value => {
        return value instanceof type
            ? { valid: true, value }
            : result.never;
    };
}
