import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping } from './types.js';

export function mapIn<T extends readonly string[]>(...values: T): TypeMapping<T[number]>;
export function mapIn<T>(...values: T[]): TypeMapping<T>;
export function mapIn<T extends readonly unknown[]>(...values: T): TypeMapping<T[number]> {
    const valueSet = new Set<unknown>(values);

    return createMapping(value => {
        if (valueSet.has(value))
            return result.success(<T[number]>value);
        return result.failed;
    });
}
