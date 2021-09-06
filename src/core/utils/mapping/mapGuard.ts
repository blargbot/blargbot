import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapGuard<T>(guard: (value: unknown) => value is T): TypeMapping<T> {
    return (value: unknown) => {
        if (guard(value))
            return { valid: true, value: value };
        return result.never;
    };
}
