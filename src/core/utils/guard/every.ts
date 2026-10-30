export function every<Input, Output extends Input>(source: Input[], guard: (value: Input) => value is Output): source is Output[];
export function every<Input, Output extends Input>(source: readonly Input[], guard: (value: Input) => value is Output): source is readonly Output[]
export function every<Input, Output extends Input>(source: readonly Input[], guard: (value: Input) => value is Output): source is readonly Output[] {
    return source.every(guard);
}
