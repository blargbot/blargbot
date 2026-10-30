type GuardFn<Input = unknown, Output extends Input = Input> = (value: Input) => value is Output;
type GuardType<Input, Guards extends Array<GuardFn<Input>>> = (Guards extends Array<infer E> ? E extends GuardFn<Input, infer R> ? (x: R) => void : never : never) extends (x: infer R) => void ? R : never;

export function isAllOf<Input, T1 extends Input, T2 extends T1>(first: GuardFn<Input, T1>, second: GuardFn<T1, T2>): (value: Input) => value is T2;
export function isAllOf<Input, T1 extends Input, T2 extends T1, T3 extends T2>(first: GuardFn<Input, T1>, second: GuardFn<T1, T2>, third: GuardFn<T2, T3>): (value: Input) => value is T3;
export function isAllOf<Input, Guards extends Array<GuardFn<Input>>>(...guards: Guards): (value: Input) => value is Input & GuardType<Input, Guards>
export function isAllOf<Input, Guards extends Array<GuardFn<Input>>>(...guards: Guards): (value: Input) => value is Input & GuardType<Input, Guards> {
    return (value: Input): value is Input & GuardType<Input, Guards> => guards.every(g => g(value));
}
