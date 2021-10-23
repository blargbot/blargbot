import { TypeMapping } from '@core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export function mapGuard<T>(guard: (value: unknown) => value is T): TypeMapping<T> {
    return createMapping(value => {
        if (guard(value))
            return result.success(value);
        return result.failed;
    });
}
