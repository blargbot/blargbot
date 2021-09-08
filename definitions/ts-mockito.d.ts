import 'ts-mockito';

declare module 'ts-mockito' {
    export function anyOfClass<T>(expectedClass: abstract new (...args: unknown[]) => T): T;
    export function anyFunction<Args extends never, Result>(): (...args: Args) => Result;
    export function anyNumber<T extends number>(): T;
    export function anyString<T extends string>(): T;
    export function anything<T>(): T;
    export function between<T extends number>(min: number, max: number): T;
    export function deepEqual<T>(expectedValue: T): T;
    export function notNull<T>(): Exclude<T, undefined | null>;
    export function strictEqual<T>(expectedValue: T): T;
    export function match<T extends string>(expectedValue: RegExp | string): T;
    export function objectContaining<T>(expectedValue: T): { readonly [key: string]: T; };

}

declare module 'ts-mockito/lib/MethodStubSetter' {
    export interface MethodStubSetter<T, ResolveType = void, RejectType = Error> {
        thenReturn(...rest: T[]): this;
        thenReturn(...rest: ResolveType[]): this;
        thenThrow(...rest: RejectType[]): this;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thenCall(func: (...args: any[]) => T | ResolveType): this;
        thenResolve(...rest: ResolveType[]): this;
        thenReject(...rest: RejectType[]): this;
    }
}
