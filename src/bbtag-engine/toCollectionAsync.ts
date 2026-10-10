export async function toArrayAsync<T>(source: Awaitable<AwaitableIterable<T>>): Promise<T[]>
export async function toArrayAsync<T, R>(source: Awaitable<AwaitableIterable<T>>, transform: (value: T, index: number) => Awaitable<R>): Promise<R[]>
export async function toArrayAsync<T>(source: Awaitable<AwaitableIterable<T>>, transform?: (value: T, index: number) => Awaitable<T>): Promise<T[]> {
    transform ??= v => v;
    const result = [];
    let i = 0;
    for await (const item of await source)
        result.push(await transform(item, i++));
    return result;
}
export async function toSetAsync<T>(source: Awaitable<AwaitableIterable<T>>, transform?: (value: T, index: number) => Awaitable<T>): Promise<Set<T>>
export async function toSetAsync<T, R>(source: Awaitable<AwaitableIterable<T>>, transform: (value: T, index: number) => Awaitable<R>): Promise<Set<R>>
export async function toSetAsync<T>(source: Awaitable<AwaitableIterable<T>>, transform?: (value: T, index: number) => Awaitable<T>): Promise<Set<T>> {
    transform ??= v => v;
    const result = new Set<T>();
    let i = 0;
    for await (const item of await source)
        result.add(await transform(item, i++));
    return result;
}
export function toAsyncIterator<T>(source: Awaitable<AwaitableIterable<T>>): AsyncGenerator<T>
export function toAsyncIterator<T, R>(source: Awaitable<AwaitableIterable<T>>, transform: (value: T, index: number) => Awaitable<R>): AsyncGenerator<R>
export async function* toAsyncIterator<T>(source: Awaitable<AwaitableIterable<T>>, transform?: (value: T, index: number) => Awaitable<T>): AsyncGenerator<T> {
    transform ??= v => v;
    let i = 0;
    for await (const item of await source)
        yield await transform(item, i++);
}

export async function isEmptyAsync<T>(source: Awaitable<AwaitableIterable<T>>): Promise<boolean> {
    for await (const _ of await source)
        return false;
    return true;
}
