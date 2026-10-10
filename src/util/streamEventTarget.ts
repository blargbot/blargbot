import { createPushIterable } from './createPushIterable.js';
import type { EventTargetLike } from './usingEventListener.js';
import { usingEventListener } from './usingEventListener.js';

export async function* streamEventTarget<
    const Event,
    Value,
    Options extends readonly unknown[]
>(
    target: EventTargetLike<[event: Event, handler: (value: Value) => void, ...Options]>,
    event: Event,
    ...options: Options
): AsyncGenerator<Value, void, void> {
    const pushIterable = createPushIterable<Value>();
    using _subscription = usingEventListener(target, event, value => pushIterable.next(value), ...options);
    yield* pushIterable.items;
}
