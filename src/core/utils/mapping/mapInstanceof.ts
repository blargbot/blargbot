import { TypeMapping } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export function mapInstanceof<T>(type: new (...args: never[]) => T): TypeMapping<T> {
    return createMapping(value => {
        return value instanceof type
            ? result.success(value)
            : result.failed;
    });
}
