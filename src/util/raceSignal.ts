import { whenAborted } from './whenAborted.js';

export async function raceSignal<T>(result: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
    if (signal === undefined)
        return await result;

    const { promise, resolve, reject } = Promise.withResolvers<T>();
    using _aborted = whenAborted(signal, reject);
    result.then(resolve, reject);
    return await promise;
}
