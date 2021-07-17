import { TypeMapping, TypeMappingResult } from '@core/types';

import { result as _result } from './result';

export function mapArray<T, R = T[]>(
    mapping: TypeMapping<T, [index: number]>,
    {
        ifNull = _result.never as TypeMappingResult<T[] | R>,
        ifUndefined = _result.never as TypeMappingResult<T[] | R>
    } = {}
): TypeMapping<T[] | R> {
    return value => {
        if (value === undefined)
            return ifUndefined;
        if (value === null)
            return ifNull;
        if (!Array.isArray(value))
            return _result.never;

        const result = [];
        let i = 0;
        for (const v of value) {
            const m = mapping(v, i++);
            if (!m.valid)
                return _result.never;
            result.push(m.value);
        }
        return { valid: true, value: result };
    };
}
