import { whenAborted } from './whenAborted.js';

export async function waitForAbort(signal: AbortSignal | undefined, cancel?: AbortSignal): Promise<unknown> {
    const { promise, resolve, reject } = Promise.withResolvers<unknown>();
    using _abort = whenAborted(signal, resolve);
    using _cancel = whenAborted(cancel, reject);
    return await promise;
}
