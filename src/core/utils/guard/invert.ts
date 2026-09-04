export function invert<Input, Output extends Input>(base: (value: Input) => value is Output): (value: Input) => value is Exclude<Input, Output> {
    return (value: Input): value is Exclude<Input, Output> => !base(value);
}
