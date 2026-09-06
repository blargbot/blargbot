import type { ImplicitArrayBuffer } from 'node:buffer';

import type { Channel, ConsumeMessage, Options } from 'amqplib';
import z from 'zod';

export function cleanType<Schema extends z.ZodType>(schema: Schema): z.ZodType<Schema['_zod']['output'], Schema['_zod']['input']> {
    return schema;
}

export const stringToNonNegativeInt = z.codec(
    z.templateLiteral([z.int().gte(0)]),
    z.int().gte(0),
    {
        decode: v => Number(v),
        encode: v => `${v}` as const
    }
);
export const stringToBool = z.codec(
    z.enum(['true', 'false']),
    z.boolean(),
    {
        decode: v => v === 'true',
        encode: v => v.toString()
    }
);

export function takeBytes(source: Uint8Array, count: number): [taken: Uint8Array, remain: Uint8Array] {
    if (source.byteLength < count)
        throw new Error(`Buffer too small. Attempted to take ${count} bytes, but only ${source.byteLength} are available.`);

    return [source.slice(0, count), source.slice(count)];
}

export function asUint8Array<Array extends ArrayBufferLike>(buffer: Buffer<Array>): Uint8Array<Array> {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export function jsonToBuffer(value: unknown, encoding?: BufferEncoding): Uint8Array<ArrayBuffer> {
    return stringToBuffer(JSON.stringify(value), encoding);
}

export function bufferToJson(value: Uint8Array, encoding?: BufferEncoding): JToken {
    return JSON.parse(bufferToString(value, encoding));
}

export function stringToBuffer(value: string, encoding?: BufferEncoding): Uint8Array<ArrayBuffer> {
    return asUint8Array(Buffer.from(value, encoding));
}

export function bufferToString(value: Uint8Array, encoding?: BufferEncoding): string {
    return asBuffer(value).toString(encoding);
}

export function asBuffer<Array extends ArrayBufferLike>(chunk: Uint8Array<Array>): Buffer<ImplicitArrayBuffer<Array>> {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
}

export function scoped<T = void>(enter: () => T, exit: (value: T) => void): Disposable {
    const scope = enter();
    let exited = false;
    return {
        [Symbol.dispose]() {
            if (exited) return;
            exited = true;
            exit(scope);
        }
    };
}

type BaseMethodStyle<Args extends readonly unknown[], Methods extends string> = {
    [P in Methods]: (...args: Args) => void;
}
type EventListenerStyle<Args extends readonly unknown[]> = BaseMethodStyle<Args, 'addEventListener' | 'removeEventListener'>;
type ListenerStyle<Args extends readonly unknown[]> = BaseMethodStyle<Args, 'addListener' | 'removeListener'>;
type OnOffStyle<Args extends readonly unknown[]> = BaseMethodStyle<Args, 'on' | 'off'>;
export function addScopedHandler<Args extends readonly unknown[], Emitter extends EventListenerStyle<Args>>(emitter: Emitter, ...args: Args): Disposable;
export function addScopedHandler<Args extends readonly unknown[], Emitter extends ListenerStyle<Args>>(emitter: Emitter, ...args: Args): Disposable;
export function addScopedHandler<Args extends readonly unknown[], Emitter extends OnOffStyle<Args>>(emitter: Emitter, ...args: Args): Disposable;
export function addScopedHandler<Args extends readonly unknown[], Emitter extends EventListenerStyle<Args> | ListenerStyle<Args> | OnOffStyle<Args>>(emitter: Emitter, ...args: Args): Disposable {
    if ('addEventListener' in emitter) {
        return scoped(
            () => emitter.addEventListener(...args),
            () => emitter.removeEventListener(...args)
        );
    }
    if ('addListener' in emitter) {
        return scoped(
            () => emitter.addListener(...args),
            () => emitter.removeListener(...args)
        );
    }
    if ('on' in emitter) {
        return scoped(
            () => emitter.on(...args),
            () => emitter.off(...args)
        );
    }

    throw new Error('Unsupported emitter.');
}

export function toAsyncHandler(options: {
    handler: (message: ConsumeMessage) => Awaitable<void>;
    catch?: (message: ConsumeMessage, error: unknown) => void;
    finally?: (message: ConsumeMessage) => void;
}): (message: ConsumeMessage | null) => void {
    const { handler, catch: $catch = () => { }, finally: $finally = () => { } } = options;
    return message => {
        if (message === null)
            return;
        try {
            const result = handler(message);
            if (result instanceof Promise) {
                result.catch(error => $catch(message, error)).finally(() => $finally(message));
                return;
            }
        } catch (error) {
            try {
                $catch(message, error);
            } finally {
                $finally(message);
            }
            return;
        }
        $finally(message);
    };
}

export async function handleDrainRequested(channel: Channel, callback: () => boolean): Promise<void> {
    while (!callback()) {
        const { promise, resolve, reject } = Promise.withResolvers<void>();
        using _closed = addScopedHandler(channel, 'close', () => reject(new Error('Channel has closed.')));
        using _drained = addScopedHandler(channel, 'drain', () => resolve());
        await promise;
    }
}

export async function publishWithRetries(channel: Channel, exchange: string, routingKey: string, content: Buffer, options?: Options.Publish): Promise<void> {
    await handleDrainRequested(channel, () => channel.publish(exchange, routingKey, content, options));
}
export async function sendToQueueWithRetries(channel: Channel, queue: string, content: Buffer, options?: Options.Publish): Promise<void> {
    await handleDrainRequested(channel, () => channel.sendToQueue(queue, content, options));
}
