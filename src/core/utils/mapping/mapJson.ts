import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapJson<T>(mapping: TypeMapping<T>): TypeMapping<T> {
    return value => {
        if (typeof value !== 'string')
            return result.never;
        try {
            return mapping(JSON.parse(value));
        } catch {
            return result.never;
        }
    };
}
