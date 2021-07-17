import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapChoice<T>(...mappings: Array<TypeMapping<T>>): TypeMapping<T> {
    return value => {
        for (const mapping of mappings) {
            const mapped = mapping(value);
            if (mapped.valid)
                return mapped;
        }
        return result.never;
    };
}
