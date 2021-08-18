import { TypeMapping, TypeMappingOptions } from '@core/types';

import { result as _result } from './result';

export function mapArray<T>(mapping: TypeMapping<T, [index: number]>): TypeMapping<T[]>;
export function mapArray<T>(mapping: TypeMapping<T, [index: number]>, options: TypeMappingOptions<T[], T[]>): TypeMapping<T[]>;
export function mapArray<T, R>(mapping: TypeMapping<T, [index: number]>, options: TypeMappingOptions<T[], R>): TypeMapping<T[] | R>;
export function mapArray<T, R>(mapping: TypeMapping<T, [index: number]>, options: TypeMappingOptions<T[], R> = {}): TypeMapping<T[] | R> {
    return value => {
        if (value === undefined)
            return options.ifUndefined ?? _result.never;
        if (value === null)
            return options.ifNull ?? _result.never;
        if (!Array.isArray(value))
            return _result.never;

        const result = options.initial?.() ?? [];
        let i = 0;
        for (const v of value) {
            const m = mapping(v, i++);
            if (!m.valid)
                return _result.never;
            result.push(m.value);
        }
        return { valid: true, value: result };
    };
}
