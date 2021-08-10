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

        function checkKey<K extends string & keyof T>(resultKey: K, sourceKey: string | undefined, mapping: TypeMapping<T[K]>): boolean {
            if (sourceKey !== undefined) {
                if (!guard.hasProperty(objValue, sourceKey)) {
                    return mapping(undefined).valid;
                }
            }
            const val = sourceKey === undefined ? undefined : objValue[sourceKey];
            const mapped = mapping(val);
            if (!mapped.valid)
                return false;
            if (<unknown>mapped.value !== undefined)
                result[resultKey] = mapped.value;
            return true;
        }

        for (const resultKey of Object.keys(mappings)) {
            const mapping = mappings[resultKey];
            const [sourceKey, mapFunc] = typeof mapping !== 'object'
                ? [resultKey, mapping]
                : mapping.length === 1
                    ? [undefined, () => ({ valid: true, value: mapping[0] })]
                    : mapping;
            if (!checkKey(resultKey, sourceKey, mapFunc))
                return _result.never;
        }

        return { valid: true, value: <T>result };
    };
}
