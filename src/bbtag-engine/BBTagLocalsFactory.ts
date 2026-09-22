export interface BBTagLocalsFactory<Input, Locals extends object> {
    toLocals(input: Input): Awaitable<Locals>;
    toInput(locals: Locals): Awaitable<Input>;
}
