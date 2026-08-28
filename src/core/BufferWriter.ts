import { Writable } from 'node:stream';
import type { QueuingStrategy } from 'node:stream/web';
import { WritableStream } from 'node:stream/web';
import { isTypedArray } from 'node:util/types';

import { PromiseCompletionSource } from './PromiseCompletionSource.js';

export class BufferWriter extends Writable {
    #core: BufferWriterCore;

    public constructor(options?: { maxSize?: number; }) {
        super();
        this.#core = new BufferWriterCore(options?.maxSize ?? Number.MAX_SAFE_INTEGER);
    }

    public getResult(): Promise<Buffer> {
        return this.#core.getResult();
    }

    public override _write(chunk: unknown, encoding: BufferEncoding, callback: (error?: null | Error | undefined) => void): void {
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
    #chunks: Buffer[] | null;
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

        let buffer: Buffer | undefined;
        if (typeof chunk === 'string')
            buffer = Buffer.from(chunk, encoding);
        else if (chunk instanceof Buffer)
            buffer = chunk;
        else if (chunk instanceof DataView)
            buffer = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        else if (chunk instanceof SharedArrayBuffer)
            buffer = Buffer.from(chunk);
        else if (chunk instanceof ArrayBuffer)
            buffer = Buffer.from(chunk);
        else if (isTypedArray(chunk))
            buffer = Buffer.from(chunk);

        let error: Error | undefined;
        if (buffer === undefined)
            error = new Error('Invalid chunk received.');
        else if (this.#size + buffer.length > this.#maxSize)
            error = new Error('Max size has been reached.');
        else {
            this.#chunks.push(buffer);
            this.#size += buffer.length;
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
