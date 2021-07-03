import GIFEncoder from 'gifencoder';
import Jimp from 'jimp';
import { JimpGifEncoderOptions } from './types';

export class JimpGifEncoder {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #encoder: GIFEncoder;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #buffers: Uint8Array[];
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #promise: Promise<Buffer>;

    public constructor({ width, height, repeat = 0, quality = 10, delay = 0 }: JimpGifEncoderOptions) {
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
            sr.on('end', () => resolve(Buffer.from(this.#buffers)));
        });
    }

    public addFrame(frame: Jimp): void {
        const byteArray = new Uint8ClampedArray(frame.bitmap.data);
        const imageData = new ImageData(byteArray, frame.bitmap.width, frame.bitmap.height);
        if (bypassBorkedTypeDefinition(imageData)) {
            this.#encoder.addFrame(imageData); // ImageData is also accepted, but for some reason not on the declaration
        }
    }

    public async render(): Promise<Buffer> {
        this.#encoder.finish();
        return await this.#promise;
    }
}

function bypassBorkedTypeDefinition(value: unknown): value is CanvasRenderingContext2D {
    return value instanceof ImageData;
}
