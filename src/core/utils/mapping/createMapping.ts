import { NormalizedTypeMapping, TypeMapping, TypeMappingImpl, TypeMappingResult } from '@core/types';

import { result } from './result';

export function createMapping<T, TArgs extends unknown[] = []>(impl: TypeMappingImpl<T, TArgs>): TypeMapping<T, TArgs> {
    return createMappingCore<T, never, TArgs>(impl, props);
}

function createMappingCore<T, U, TArgs extends unknown[]>(
    impl: TypeMappingImpl<T | U, TArgs>,
    props: { [P in keyof TypeMapping<T, TArgs>]: StrongPropertyDescriptor<TypeMapping<T, TArgs>[P]>; })
    : TypeMapping<T | U, TArgs> {
    return Object.defineProperties(impl, props);
}

function createNormalizedMapping<T, TArgs extends unknown[], TUndefined, TNull>(
    mapping: TypeMappingImpl<T, TArgs>,
    whenUndefined: TypeMappingResult<TUndefined>,
    whenNull: TypeMappingResult<TNull>
): NormalizedTypeMapping<T, TUndefined | TNull, TArgs> {
    return createMappingCore<Exclude<T, undefined | null>, TUndefined | TNull, TArgs>(
        (value, ...args) => {
            switch (value) {
                case undefined: return whenUndefined;
                case null: return whenNull;
                default: {
                    const mapped = mapping(value, ...args);
                    if (mapped.valid === false)
                        return result.failed;
                    switch (mapped.value) {
                        case undefined: return whenUndefined;
                        case null: return whenNull;
                        default: return mapped as TypeMappingResult<Exclude<T, null | undefined>>;
                    }
                }
            }
        },
        props
    );
}

const props: { [P in keyof TypeMapping<unknown>]: PropertyDescriptor & { get<T, TArgs extends unknown[]>(): TypeMapping<T, TArgs>[P]; } } = {
    nullable: {
        configurable: true,
        get: function <T, TArgs extends unknown[]>(this: TypeMapping<T, TArgs>) {
            return Object.defineProperty(this, 'nullable', {
                configurable: false,
                writable: false,
                value: createNormalizedMapping(this, result.failed, result.null)
            }).nullable;
        }
    },
    nullish: {
        configurable: true,
        get: function <T, TArgs extends unknown[]>(this: TypeMapping<T, TArgs>) {
            return Object.defineProperty(this, 'nullish', {
                configurable: false,
                writable: false,
                value: createNormalizedMapping(this, result.undefined, result.null)
            }).nullish;
        }
    },
    optional: {
        configurable: true,
        get: function <T, TArgs extends unknown[]>(this: TypeMapping<T, TArgs>) {
            return Object.defineProperty(this, 'optional', {
                configurable: false,
                writable: false,
                value: createNormalizedMapping(this, result.undefined, result.failed)
            }).optional;
        }
    },
    required: {
        configurable: true,
        get: function <T, TArgs extends unknown[]>(this: TypeMapping<T, TArgs>) {
            return Object.defineProperty(this, 'required', {
                configurable: false,
                writable: false,
                value: createNormalizedMapping(this, result.failed, result.failed)
            }).required;
        }
    }
};
