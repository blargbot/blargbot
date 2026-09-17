export interface BBTagSerializer<Locals extends Record<string, unknown>> {
    serialize(locals: Locals): Awaitable<Uint8Array>;
    deserialize(data: Uint8Array): Awaitable<Locals>;
}
