import 'ts-mockito';

declare module 'ts-mockito' {
    export function anyFunction<TArgs extends unknown[], TResult>(): (...args: TArgs) => TResult;
    export function anyNumber(): number;
    export function anyString(): string;
}
