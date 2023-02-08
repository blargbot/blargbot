import { createMapping } from './createMapping.js';
import { result } from './result.js';
import type { TypeMapping } from './types.js';

export function mapInstanceof<T>(type: new (...args: never[]) => T): TypeMapping<T> {
    return createMapping(value => {
        return value instanceof type
            ? result.success(value)
            : result.failed;
    });
}
