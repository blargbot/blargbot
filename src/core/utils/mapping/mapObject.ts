import { TypeMapping, TypeMappingImpl, TypeMappings } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export function mapObject<T>(mappings: TypeMappings<T>, options?: { initial?: () => Partial<T>; strict: boolean; }): TypeMapping<T> {
    return createMapping(value => {
        if (value === undefined || typeof value !== 'object' || value === null)
            return result.failed;

        const objValue = <Record<PropertyKey, unknown>>value;
        const mapped: Partial<T> = options?.initial?.() ?? {};
        const remainingKeys = new Set<PropertyKey>(Object.keys(objValue));

        function checkKey<K extends keyof T>(resultKey: K, sourceKey: PropertyKey | undefined, mapping: TypeMappingImpl<T[K]>): boolean {
            if (sourceKey !== undefined)
                remainingKeys.delete(sourceKey);
            const val = sourceKey === undefined ? undefined : objValue[sourceKey];
            const mappedProp = mapping(val);
            if (!mappedProp.valid)
                return false;
            if (<unknown>mappedProp.value !== undefined)
                mapped[resultKey] = mappedProp.value;
            return true;
        }

        for (const [resultKey, mapping] of Object.entries<keyof T, TypeMappings<T>[keyof T]>(mappings)) {
            if (!checkKey(resultKey, ...splitMapping(resultKey, mapping)))
                return result.failed;
        }

        if (options?.strict !== false && remainingKeys.size > 0)
            return result.failed;

        return result.success(<T>mapped);
    });
}

function splitMapping<T, K extends keyof T>(key: K, mapping: TypeMappings<T>[K]): [PropertyKey | undefined, TypeMappingImpl<T[K]>] {
    if (typeof mapping !== 'object')
        return [key, mapping];

    if (mapping.length === 1)
        return [undefined, () => result.success(mapping[0])];

    return mapping;
}
