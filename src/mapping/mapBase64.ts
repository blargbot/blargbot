import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping, TypeMappingImpl } from './types';

export function mapBase64<T>(mapping: TypeMappingImpl<T>): TypeMapping<T> {
    return createMapping(value => {
        if (typeof value !== `string`)
            return result.failed;
        try {
            return mapping(Buffer.from(value, `base64`).toString(`utf8`));
        } catch {
            return result.failed;
        }
    });
}
