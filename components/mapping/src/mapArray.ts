import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping, TypeMappingImpl } from './types.js';

export function mapArray<T>(mapping: TypeMappingImpl<T, [index: number]>): TypeMapping<T[]> {
    return createMapping(value => {
        if (!Array.isArray(value))
            return result.failed;

        const mapped = [];
        let i = 0;
        for (const v of value) {
            const m = mapping(v, i++);
            if (!m.valid)
                return result.failed;
            mapped.push(m.value);
        }
        return result.success(mapped);
    });
}
