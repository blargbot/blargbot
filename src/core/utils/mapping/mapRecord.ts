import { TypeMapping, TypeMappingResult } from '@core/types';

import { result as _result } from './result';

export function mapRecord<T, R>(
    mapping: TypeMapping<T, [key: string]>,
    {
        ifNull = _result.never as TypeMappingResult<Record<string, T> | R>,
        ifUndefined = _result.never as TypeMappingResult<Record<string, T> | R>
    } = {}
): TypeMapping<Record<string, T> | R> {
    return value => {
        if (value === undefined)
            return ifUndefined;
        if (typeof value !== 'object')
            return _result.never;
        if (value === null)
            return ifNull;

        const result: Record<string, T> = {};
        for (const key of Object.keys(value)) {
            const mapped = mapping(value[key], key);
            if (!mapped.valid)
                return _result.never;
            result[key] = mapped.value;
        }
        return { valid: true, value: result };
    };
}
