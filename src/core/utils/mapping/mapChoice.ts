import { TypeMapping } from '@core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export function mapChoice<T extends unknown[]>(...mappings: { [P in keyof T]: TypeMapping<T[P]> }): TypeMapping<T[number]> {
    return createMapping(value => {
        for (const mapping of mappings) {
            const mapped = mapping(value);
            if (mapped.valid)
                return mapped;
        }
        return result.failed;
    });
}
