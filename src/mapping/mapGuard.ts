import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export function mapGuard<T>(guard: (value: unknown) => value is T): TypeMapping<T> {
    return createMapping(value => {
        if (guard(value))
            return result.success(value);
        return result.failed;
    });
}
