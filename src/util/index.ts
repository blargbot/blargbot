import type { ImplicitArrayBuffer } from 'node:buffer';

export * from './AsyncResetValue.js';
export * from './BalancedWorkerShardMap.js';
export * from './createId.js';
export * from './createPushIterable.js';
export * from './debounce.js';
export * from './deepClone.js';
export * from './disposable.js';
export * from './Iterable.js';
export * from './raceSignal.js';
export * from './range.js';
export * from './Registry.js';
export * from './Semaphore.js';
export * from './sleep.js';
export * from './streamEventEmitter.js';
export * from './streamEventTarget.js';
export * from './throttle.js';
export * from './usingEventListener.js';
export * from './usingInterval.js';
export * from './usingListener.js';
export * from './usingTimeout.js';
export * from './waitForAbort.js';
export * from './whenAborted.js';

export function asUint8Array<Array extends ArrayBufferLike>(buffer: Buffer<Array>): Uint8Array<Array> {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export function jsonToBuffer(value: unknown, encoding?: BufferEncoding, replacer?: (key: string, value: unknown) => unknown): Uint8Array<ArrayBuffer> {
    return stringToBuffer(JSON.stringify(value, replacer), encoding);
}

export function bufferToJson(value: Uint8Array, encoding?: BufferEncoding, reviver?: (key: string, value: unknown) => unknown): JToken {
    return JSON.parse(bufferToString(value, encoding), reviver) as JToken;
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
