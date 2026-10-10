import { disposable } from './disposable.js';

export function usingTimeout(callback: () => void, delay: number = 0): Disposable {
    const timeout = setTimeout(callback, delay);
    return disposable.create(clearTimeout, timeout);
}
