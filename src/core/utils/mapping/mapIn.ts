import { mappingResultNever } from './constants';
import { TypeMapping } from './types';

export function mapIn<T>(...values: readonly T[]): TypeMapping<T> {
    const valueSet = new Set<unknown>(values);

    return (value: unknown) => {
        if (valueSet.has(value))
            return { valid: true, value: <T>value };
        return mappingResultNever;
    };
}
