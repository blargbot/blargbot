import { TypeMapping, TypeMappingImpl } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

type TupleTypeMapping<T extends unknown[]> = { [P in keyof T]: TypeMappingImpl<T[P]> } & { length: T['length']; };
export function mapTuple<T extends unknown[]>(mappings: TupleTypeMapping<T>): TypeMapping<T> {
    return createMapping(value => {
        if (!Array.isArray(value))
            return result.failed;

        const mapped = new Array(mappings.length) as T;

        for (let i = 0; i < mappings.length; i++) {
            const toMap = value[i];
            if (toMap === undefined)
                return result.failed;

            const mappedItem = mappings[i](toMap);
            if (!mappedItem.valid)
                return result.failed;

            mapped[i] = mappedItem.value;
        }

        return result.success(mapped);
    });
}
