import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapBase64<T>(mapping: TypeMapping<T>): TypeMapping<T> {
    return value => {
        if (typeof value !== 'string')
            return result.never;
        try {
            return mapping(Buffer.from(value, 'base64').toString('utf8'));
        } catch {
            return result.never;
        }
    };
}
