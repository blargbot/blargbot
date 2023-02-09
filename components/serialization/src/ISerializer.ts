export interface ISerializer<T> {
    read(value: string): T;
    write(value: T): string;
}
