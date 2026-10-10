import { usingTimeout } from './usingTimeout.js';
import { whenAborted } from './whenAborted.js';

export async function sleep(delay: number, signal?: AbortSignal): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    using _timeout = usingTimeout(resolve, delay);
    using _aborted = whenAborted(signal, reject);
    await promise;
}
