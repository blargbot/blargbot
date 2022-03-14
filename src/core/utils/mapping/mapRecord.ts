import { TypeMapping, TypeMappingImpl } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export function mapRecord<T>(mapping: TypeMappingImpl<T, [key: string]>, initial?: () => Record<string, T>): TypeMapping<Record<string, T>> {
    return createMapping(value => {
        if (value === undefined || typeof value !== 'object' || value === null)
            return result.failed;

        const mapped: Record<string, T> = initial?.() ?? {};
        for (const [key, prop] of Object.entries(value)) {
            const mappedProp = mapping(prop, key);
            if (!mappedProp.valid)
                return result.failed;
            mapped[key] = mappedProp.value;
        }
        return result.success(mapped);
    });
}
