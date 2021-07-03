import { mappingResultNever } from './constants';
import { TypeMapping } from './types';

export function mapJson<T>(mapping: TypeMapping<T>): TypeMapping<T> {
    return value => {
        if (typeof value !== 'string')
            return mappingResultNever;
        try {
            return mapping(JSON.parse(value));
        } catch {
            return mappingResultNever;
        }
    };
}
