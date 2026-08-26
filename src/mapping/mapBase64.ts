import { createMapping } from './createMapping.js';
import { result } from './result.js';
import type { TypeMapping, TypeMappingImpl } from './types.js';

export function mapBase64<T>(mapping: TypeMappingImpl<T>): TypeMapping<T> {
    return createMapping(value => {
        if (typeof value !== 'string')
            return result.failed;
        try {
            return mapping(Buffer.from(value, 'base64').toString('utf8'));
        } catch {
            return result.failed;
        }
    });
}
