import 'ts-mockito';

declare module 'ts-mockito' {
    export function anyString<T extends string>(): T;
    export function anyOfClass<T>(type: new (...args: never[]) => T): T;
    export function anyOfClass<T>(type: abstract new (...args: never[]) => T): T;
}
