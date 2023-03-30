export interface ISerializer<Value> {
    read(value: string): Awaitable<Value>;
    write(value: Value): Awaitable<string>;
}
