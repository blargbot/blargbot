export interface BBTagSerializer<Input> {
    serialize(input: Input): Awaitable<Uint8Array>;
    deserialize(data: Uint8Array): Awaitable<Input>;
}
