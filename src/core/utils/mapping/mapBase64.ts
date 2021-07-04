import { mappingResultNever } from './constants';
import { TypeMapping } from './types';

export function mapBase64<T>(mapping: TypeMapping<T>): TypeMapping<T> {
    return value => {
        if (typeof value !== 'string')
            return mappingResultNever;
        try {
            return mapping(Buffer.from(value, 'base64').toString('utf8'));
        } catch {
            return mappingResultNever;
        }
    };
}
