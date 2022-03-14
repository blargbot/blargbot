import { TypeMapping, TypeMappingImpl } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

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
