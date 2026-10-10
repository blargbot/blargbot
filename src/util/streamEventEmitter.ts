import { createPushIterable } from './createPushIterable.js';
import type { EventEmitterLike } from './usingListener.js';
import { usingListener } from './usingListener.js';

export async function* streamEventEmitter<
    const Event,
    Value,
    Options extends readonly unknown[]
>(
    target: EventEmitterLike<[event: Event, handler: (value: Value) => void, ...Options]>,
    event: Event,
    ...options: Options
): AsyncGenerator<Value, void, void> {
    const pushIterable = createPushIterable<Value>();
    using _subscription = usingListener(target, event, value => pushIterable.next(value), ...options);
    yield* pushIterable.items;
}
