import { TypeMapping, TypeMappingResult, TypeMappings } from '@core/types';

import * as guard from '../guard';
import { result as _result } from './result';

export function mapObject<T>(
    mappings: TypeMappings<T>,
    {
        initial = () => ({}) as Partial<T>,
        ifNull = _result.never as TypeMappingResult<T>,
        ifUndefined = _result.never as TypeMappingResult<T>
    } = {}
): TypeMapping<T> {
    return value => {
        if (value === undefined)
            return ifUndefined;
        if (typeof value !== 'object')
            return _result.never;
        if (value === null)
            return ifNull;

        const objValue = <Record<string, unknown>>value;
        const result = initial();

        function checkKey<K extends string & keyof T>(key: K, mapping: TypeMapping<T[K]>): boolean {
            if (!guard.hasProperty(objValue, key)) {
                return mapping(undefined).valid;
            }
            const val = objValue[key];
            const mapped = mapping(val);
            if (!mapped.valid)
                return false;
            if (<unknown>mapped.value !== undefined)
                result[key] = mapped.value;
            return true;
        }

        for (const key of Object.keys(mappings)) {
            const mapping = mappings[key];
            if (!checkKey(key, mapping))
                return _result.never;
        }

        return { valid: true, value: <T>result };
    };
}
