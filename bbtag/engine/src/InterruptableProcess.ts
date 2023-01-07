export type InterruptableProcess<T> =
    | InterruptableSyncProcess<T>
    | InterruptableAsyncProcess<T>;

export interface InterruptableSyncProcess<T> extends Generator<void, T, void> {
    [Symbol.iterator](): this;
}

export interface InterruptableAsyncProcess<T> extends AsyncGenerator<void, T, void> {
    [Symbol.asyncIterator](): this;
}
