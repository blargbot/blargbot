import type { InterruptableAsyncProcess, InterruptableSyncProcess } from './InterruptableProcess.js';

export function processResult<T>(value: T): InterruptableSyncProcess<T> {
    return {
        [Symbol.iterator]() {
            return this;
        },
        next() {
            return { done: true, value };
        },
        return(value) {
            return { done: true, value };
        },
        throw(err: unknown) {
            throw err;
        }
    };
}

export function processAsyncResult<T>(value: Awaitable<T>): InterruptableAsyncProcess<T> {
    return {
        [Symbol.asyncIterator]() {
            return this;
        },
        async next() {
            return { done: true, value: await value };
        },
        async return(value) {
            return { done: true, value: await value };
        },
        throw(err: unknown) {
            return Promise.reject(err);
        }
    };
}
