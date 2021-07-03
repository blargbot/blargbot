import { guard } from '../guard';
import { mappingResultNever } from './constants';
import { TypeMapping, TypeMappingResult, TypeMappings } from './types';

export function mapObject<T>(
    mappings: TypeMappings<T>,
    {
        initial = () => ({}) as Partial<T>,
        ifNull = mappingResultNever as TypeMappingResult<T>,
        ifUndefined = mappingResultNever as TypeMappingResult<T>
    } = {}
): TypeMapping<T> {
    return value => {
        if (value === undefined)
            return ifUndefined;
        if (typeof value !== 'object')
            return mappingResultNever;
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
            if (mapped.value !== undefined)
                result[key] = mapped.value;
            return true;
        }

        for (const key of Object.keys(mappings)) {
            const mapping = mappings[key];
            if (!checkKey(key, mapping))
                return mappingResultNever;
        }

        return { valid: true, value: <T>result };
    };
}
