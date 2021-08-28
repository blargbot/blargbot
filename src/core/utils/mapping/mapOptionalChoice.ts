import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapOptionalChoice<T>(...mappings: Array<TypeMapping<T>>): TypeMapping<T | undefined> {
    return value => {
        for (const mapping of mappings) {
            const mapped = mapping(value);
            if (mapped.valid)
                return mapped;
        }
        return value === null || value === undefined
            ? result.undefined : result.never;
    };
}
