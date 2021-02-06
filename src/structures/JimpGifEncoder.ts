import GIFEncoder from "gifencoder";
import Jimp from "jimp";
import { del } from "request";

interface JimpGifEncoderOptions {
    width: number,
    height: number,
    repeat?: number,
    quality?: number,
    delay?: number
}

export class JimpGifEncoder {
    readonly #encoder: GIFEncoder;
    readonly #buffers: Uint8Array[];
    readonly #promise: Promise<Buffer>;

    constructor({ width, height, repeat = 0, quality = 10, delay = 0 }: JimpGifEncoderOptions) {
        this.#encoder = new GIFEncoder(width, height);
        this.#encoder.setRepeat(repeat);
        this.#encoder.setQuality(quality);
        this.#encoder.setDelay(delay);
        this.#encoder.start();
        this.#buffers = [];
        this.#promise = new Promise<Buffer>((resolve, reject) => {
            let sr = this.#encoder.createReadStream();
            sr.on('data', data => this.#buffers.push(data));
            sr.on('error', err => reject(err));
            sr.on('end', () => resolve(Buffer.from(this.#buffers)));
        });
    }

    public addFrame(frame: Jimp) {
        const byteArray = new Uint8ClampedArray(frame.bitmap.data);
        const imageData = new ImageData(byteArray, frame.bitmap.width, frame.bitmap.height);
        this.#encoder.addFrame(<any>imageData); // ImageData is also accepted, but for some reason not on the declaration
    }

    public render() {
        this.#encoder.finish();
        return this.#promise;
    }
}