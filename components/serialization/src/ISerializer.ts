export interface ISerializer<T> {
    read(value: string): Awaitable<T>;
    write(value: T): Awaitable<string>;
}
