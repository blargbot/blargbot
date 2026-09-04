type GuardFn<Input = unknown, Output extends Input = Input> = (value: Input) => value is Output;
type GuardType<Input, Guards extends Array<GuardFn<Input>>> = Guards extends Array<infer E> ? E extends GuardFn<Input, infer R> ? R : never : never;

export function isAnyOf<Input, Guards extends Array<GuardFn<Input>>>(...guards: Guards): (value: Input) => value is Input & GuardType<Input, Guards> {
    return (value: Input): value is Input & GuardType<Input, Guards> => guards.some(g => g(value));
}
