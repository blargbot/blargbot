import { mappingResultNever } from './constants';
import { TypeMapping } from './types';

export function mapAny<T>(...mappings: Array<TypeMapping<T>>): TypeMapping<T> {
    return value => {
        for (const mapping of mappings) {
            const mapped = mapping(value);
            if (mapped.valid)
                return mapped;
        }
        return mappingResultNever;
    };
}
