import { TypeMapping, TypeMappingImpl } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

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
