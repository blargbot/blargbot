import { Canvas, createCanvas, ImageData, NodeCanvasRenderingContext2D } from 'canvas';
import GIFEncoder from 'gifencoder';
import Jimp from 'jimp';

import { JimpGifEncoderOptions } from './types';

export class JimpGifEncoder {
    readonly #canvas: Canvas;
    readonly #canvasContext: NodeCanvasRenderingContext2D;
    readonly #encoder: GIFEncoder;
    readonly #buffers: Uint8Array[];
    readonly #promise: Promise<Buffer>;

    public constructor({ width, height, repeat = 0, quality = 10, delay = 0 }: JimpGifEncoderOptions) {
        this.#canvas = createCanvas(width, height);
        this.#canvasContext = this.#canvas.getContext('2d');
        this.#encoder = new GIFEncoder(width, height);
        this.#encoder.setRepeat(repeat);
        this.#encoder.setQuality(quality);
        this.#encoder.setDelay(delay);
        this.#encoder.start();
        this.#buffers = [];
        this.#promise = new Promise<Buffer>((resolve, reject) => {
            const sr = this.#encoder.createReadStream();
            sr.on('data', (data: Uint8Array) => this.#buffers.push(data));
            sr.on('error', err => reject(err));
            sr.on('end', () => {
                const buffer = new Uint8Array(this.#buffers.reduce((c, b) => c + b.length, 0));
                this.#buffers.reduce((c, b) => {
                    buffer.set(b, c);
                    return c + b.length;
                }, 0);
                resolve(Buffer.from(buffer));
            });
        });
    }

    public addFrame(frame: Jimp): void {
        this.#canvasContext.putImageData(new ImageData(new Uint8ClampedArray(frame.bitmap.data), frame.bitmap.width, frame.bitmap.height), 0, 0);
        this.#encoder.addFrame(this.#canvasContext);
    }

    public async render(): Promise<Buffer> {
        this.#encoder.finish();
        return await this.#promise;
    }
}
