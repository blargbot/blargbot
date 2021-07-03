export type TypeMappingResult<T> = { valid: false; } | { valid: true; value: T; };
export type TypeMapping<T, TArgs extends unknown[] = []> = (value: unknown, ...args: TArgs) => TypeMappingResult<T>;
export type TypeMappings<T> = { readonly [P in keyof T]-?: TypeMapping<T[P]> };
