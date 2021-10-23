import { TypeMapping } from '@core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export function mapIn<T>(...values: readonly T[]): TypeMapping<T> {
    const valueSet = new Set<unknown>(values);

    return createMapping(value => {
        if (valueSet.has(value))
            return result.success(<T>value);
        return result.failed;
    });
}
