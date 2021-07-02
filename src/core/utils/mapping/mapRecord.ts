import { mappingResultNever } from './constants';
import { TypeMapping, TypeMappingResult } from './types';

export function mapRecord<T, R>(
    mapping: TypeMapping<T, [key: string]>,
    {
        ifNull = mappingResultNever as TypeMappingResult<Record<string, T> | R>,
        ifUndefined = mappingResultNever as TypeMappingResult<Record<string, T> | R>
    } = {}
): TypeMapping<Record<string, T> | R> {
    return value => {
        if (value === undefined)
            return ifUndefined;
        if (typeof value !== 'object')
            return mappingResultNever;
        if (value === null)
            return ifNull;

        const result: Record<string, T> = {};
        for (const key of Object.keys(value)) {
            const mapped = mapping(value[key], key);
            if (!mapped.valid)
                return mappingResultNever;
            result[key] = mapped.value;
        }
        return { valid: true, value: result };
    };
}
