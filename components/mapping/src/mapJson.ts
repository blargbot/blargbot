import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping, TypeMappingImpl } from './types.js';

export function mapJson<T>(mapping: TypeMappingImpl<T>): TypeMapping<T> {
    return createMapping(value => {
        if (typeof value !== 'string')
            return result.failed;
        try {
            return mapping(JSON.parse(value));
        } catch {
            return result.failed;
        }
    });
}
