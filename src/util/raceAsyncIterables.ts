import { whenAborted } from './whenAborted.js';

export async function* raceAsyncIterable<T>(sources: Iterable<AsyncIterable<T, void, void>>, signal?: AbortSignal): AsyncGenerator<T, void, void> {
    type Result = { value: IteratorResult<T, void>; iterator: AsyncIterator<T, void, void>; };
    const iterators: Array<AsyncIterator<T, void, void>> = [];
    const pending = new Map<AsyncIterator<T, void, void>, Promise<Result>>();
    const aborted = Promise.withResolvers<never>();
    aborted.promise.catch(() => { });
    signal?.throwIfAborted();
    using _onAbort = whenAborted(signal, aborted.reject);
    let error: undefined | { value: unknown; };
    try {
        for (const source of sources)
            iterators.push(source[Symbol.asyncIterator]());
        for (const iterator of iterators)
            pending.set(iterator, nextWithIterator(iterator));
        while (pending.size > 0) {
            const winner = await Promise.race([aborted.promise, ...pending.values()]);
            if (winner.value.done === true) {
                pending.delete(winner.iterator);
                iterators.splice(iterators.indexOf(winner.iterator), 1);
            } else {
                pending.set(winner.iterator, nextWithIterator(winner.iterator));
                yield winner.value.value;
            }
        }
    } catch (err) {
        error = { value: err };
    } finally {
        let iterator;
        while ((iterator = iterators.pop()) !== undefined) {
            try {
                await pending.get(iterator);
                await iterator.return?.();
            } catch (err) {
                error = { value: err };
            }
        }
        if (error !== undefined)
            // eslint-disable-next-line no-unsafe-finally
            throw error.value;
    }

    async function nextWithIterator(iterator: AsyncIterator<T, void, void>): Promise<Result> {
        return {
            value: await iterator.next(),
            iterator
        };
    }
}
