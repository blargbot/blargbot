import { disposable } from './disposable.js';
import { usingEventListener } from './usingEventListener.js';

export function whenAborted(signal: AbortSignal | undefined, handler: (reason: unknown) => void): Disposable {
    if (signal === undefined)
        return disposable.empty;

    if (signal.aborted) {
        const timeout = setImmediate(handler.bind(signal.reason));
        return disposable.create(clearImmediate, timeout);
    }

    return usingEventListener(signal, 'abort', () => handler(signal.reason));
}
