import { Writable } from 'node:stream';
import type { QueuingStrategy } from 'node:stream/web';
import { WritableStream } from 'node:stream/web';
import { isTypedArray } from 'node:util/types';

import { PromiseCompletionSource } from './PromiseCompletionSource.js';

export class BufferWriter extends Writable {
    readonly #core: BufferWriterCore;

    public constructor(options?: { maxSize?: number; }) {
        super();
        this.#core = new BufferWriterCore(options?.maxSize ?? Number.MAX_SAFE_INTEGER);
    }

    public getResult(): Promise<Buffer> {
        return this.#core.getResult();
    }

    public override _write(chunk: unknown, encoding: BufferEncoding, callback: (error?: null | Error  ) => void): void {
        callback(this.#core.push(chunk, encoding));
    }

    public override _final(): void {
        this.#core.finish();
    }
}

export class BufferWriterStream extends WritableStream<Buffer | string | DataView | NodeJS.TypedArray | SharedArrayBuffer | ArrayBuffer> {
    readonly #core: BufferWriterCore;

    public constructor(options?: { maxSize?: number; encoding?: BufferEncoding; }, queueingStrategy?: QueuingStrategy) {
        const { maxSize = Number.MAX_SAFE_INTEGER, encoding = 'utf-8' } = options ?? {};
        const core = new BufferWriterCore(maxSize);
        super({
            write: (chunk, controller) => {
                const error = core.push(chunk, encoding);
                if (error !== null)
                    controller.error(error);
            },
            close: () => core.finish()
        }, queueingStrategy);
        this.#core = core;
    }

    public getResult(): Promise<Buffer> {
        return this.#core.getResult();
    }
}

class BufferWriterCore {
    readonly #maxSize: number;
    #chunks: Uint8Array[] | null;
    #size: number;
    readonly #result: PromiseCompletionSource<Buffer>;

    public constructor(maxSize: number) {
        this.#maxSize = maxSize;
        this.#chunks = [];
        this.#size = 0;
        this.#result = new PromiseCompletionSource();
    }

    public getResult(): Promise<Buffer> {
        return this.#result.promise;
    }

    public push(chunk: unknown, encoding: BufferEncoding): Error | null {
        if (this.#chunks === null) {
            return new Error('Stream is not in a state that can be written to.');
        }

        let buffer: Uint8Array | undefined;
        if (typeof chunk === 'string')
            buffer = toUInt8Array(Buffer.from(chunk, encoding));
        else if (chunk instanceof Buffer)
            buffer = toUInt8Array(chunk);
        else if (chunk instanceof DataView)
            buffer = toUInt8Array(chunk);
        else if (chunk instanceof SharedArrayBuffer)
            buffer = toUInt8Array(chunk);
        else if (chunk instanceof ArrayBuffer)
            buffer = toUInt8Array(chunk);
        else if (isTypedArray(chunk))
            buffer = toUInt8Array(chunk);

        let error: Error | undefined;
        if (buffer === undefined)
            error = new Error('Invalid chunk received.');
        else if (this.#size + buffer.byteLength > this.#maxSize)
            error = new Error('Max size has been reached.');
        else {
            this.#chunks.push(buffer);
            this.#size += buffer.byteLength;
            return null;
        }

        this.#result.reject(error);
        this.#chunks = null;
        return error;
    }

    public finish(): void {
        if (this.#chunks === null)
            return;

        this.#result.resolve(Buffer.concat(this.#chunks));
        this.#chunks = null;
    }
}

function toUInt8Array(source: Pick<Uint8Array, 'buffer' | 'byteLength' | 'byteOffset'> | ArrayBufferLike): Uint8Array {
    if ('buffer' in source)
        return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    return new Uint8Array(source);
}
