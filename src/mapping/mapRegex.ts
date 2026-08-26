import { createMapping } from './createMapping.js';
import { result } from './result.js';
import type { TypeMapping } from './types.js';

export function mapRegex<T extends string>(regex: RegExp): TypeMapping<T> {
    return createMapping(value => {
        if (typeof value === 'string' && regex.test(value))
            return result.success(<T>value);
        return result.failed;
    });
}
