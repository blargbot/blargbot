import 'ts-mockito';

declare module 'ts-mockito' {
    export function anyOfClass<T>(expectedClass: abstract new (...args: unknown[]) => T): T;
    export function anyFunction<Args extends unknown[], Result>(): (...args: Args) => Result;
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
