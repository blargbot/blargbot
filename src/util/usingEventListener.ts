import { disposable } from './disposable.js';

export interface EventTargetLike<in Args extends readonly unknown[]> {
    addEventListener(...args: Args): void;
    removeEventListener(...args: Args): void;
}

export function usingEventListener<
    const Args extends readonly unknown[],
>(
    target: EventTargetLike<Args>,
    ...args: Args
): Disposable {
    target.addEventListener(...args);
    return disposable.create(() => target.removeEventListener(...args));
}
