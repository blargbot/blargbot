export type TypeMappingResult<T> = { readonly valid: false; } | { readonly valid: true; readonly value: T; };
export type NormalizedTypeMapping<T, TUnion, TArgs extends unknown[] = []> = TypeMapping<Exclude<T, undefined | null> | TUnion, TArgs>;
export type TypeMappingImpl<T, TArgs extends unknown[] = []> = (value: unknown, ...args: TArgs) => TypeMappingResult<T>;

export interface TypeMapping<T, TArgs extends unknown[] = []> extends TypeMappingImpl<T, TArgs> {
    readonly required: NormalizedTypeMapping<T, never, TArgs>;
    readonly optional: NormalizedTypeMapping<T, undefined, TArgs>;
    readonly nullable: NormalizedTypeMapping<T, null, TArgs>;
    readonly nullish: NormalizedTypeMapping<T, null | undefined, TArgs>;
    map<R>(mapping: (value: T, ...args: TArgs) => R): TypeMapping<R, TArgs>;
    chain<R>(mapping: (value: T, ...args: TArgs) => TypeMappingResult<R>): TypeMapping<R, TArgs>;
}

export type TypeMappings<T, TArgs extends unknown[] = []> = {
    readonly [P in keyof T]-?:
    | TypeMappingImpl<T[P], TArgs>
    | [PropertyKey, TypeMappingImpl<T[P], TArgs>]
    | [T[P]]
};
