import { createMapping } from './createMapping.js';
import { result } from './result.js';
import type { TypeMapping } from './types.js';

export function mapGuard<T>(guard: (value: unknown) => value is T): TypeMapping<T> {
    return createMapping(value => {
        if (guard(value))
            return result.success(value);
        return result.failed;
    });
}
