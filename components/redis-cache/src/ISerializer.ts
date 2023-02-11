export interface ISerializer<Value> {
    read(value: string): Value;
    write(value: Value): string;
}
