export interface BBTagLocalsFactory<Input, Locals extends Record<string, unknown>> {
    toLocals(input: Input): Awaitable<Locals>;
    toInput(locals: Locals): Awaitable<Input>;
}
