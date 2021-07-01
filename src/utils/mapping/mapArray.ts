import { mappingResultNever } from './constants';
import { TypeMapping, TypeMappingResult } from './types';

export function mapArray<T, R>(
    mapping: TypeMapping<T, [index: number]>,
    {
        ifNull = mappingResultNever as TypeMappingResult<T[] | R>,
        ifUndefined = mappingResultNever as TypeMappingResult<T[] | R>
    } = {}
): TypeMapping<T[] | R> {
    return value => {
        if (value === undefined)
            return ifUndefined;
        if (value === null)
            return ifNull;
        if (!Array.isArray(value))
            return mappingResultNever;

        const result = [];
        let i = 0;
        for (const v of value) {
            const m = mapping(v, i++);
            if (!m.valid)
                return mappingResultNever;
            result.push(m.value);
        }
        return { valid: true, value: result };
    };
}
