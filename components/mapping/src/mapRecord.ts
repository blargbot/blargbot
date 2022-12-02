import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping, TypeMappingImpl } from './types.js';

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
