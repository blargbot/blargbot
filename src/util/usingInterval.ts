import { disposable } from './disposable.js';

export function usingInterval(callback: () => void, delay: number = 0): Disposable {
    const interval = setInterval(callback, delay);
    return disposable.create(clearInterval, interval);
}
