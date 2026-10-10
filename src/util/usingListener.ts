import { disposable } from './disposable.js';

export interface EventEmitterLike<in Args extends readonly unknown[]> {
    addListener(...args: Args): void;
    removeListener(...args: Args): void;
}

export function usingListener<
    const Args extends readonly unknown[],
>(
    target: EventEmitterLike<Args>,
    ...args: Args
): Disposable {
    target.addListener(...args);
    return disposable.create(() => target.removeListener(...args));
}
