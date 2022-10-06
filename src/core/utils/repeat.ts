export function repeat<T extends Exclude<Primitive, (...args: never) => unknown>>(count: number, value: T | ((index: number) => T)): T[] {
    const result: T[] = [];
    if (typeof value !== `function`)
        for (let i = 0; i < count; i++)
            result.push(value);

    else
        for (let i = 0; i < count; i++)
            result.push(<T>value(i));

    return result;
}
