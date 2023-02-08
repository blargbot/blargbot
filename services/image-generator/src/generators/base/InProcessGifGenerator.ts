import GIFEncoder from 'gifencoder';
import type sharp from 'sharp';
import { Readable } from 'stream';

import InProcessImageGenerator from './InProcessImageGenerator.js';

export interface GifOptions extends GIFEncoder.GIFOptions {
    readonly width: number;
    readonly height: number;
}

export default abstract class InProcessGifGenerator<Options> extends InProcessImageGenerator<Options> {
    protected abstract generateGif(options: Options): Promise<Blob> | AsyncIterable<Buffer | sharp.Sharp>;
    protected abstract getGifOptions(options: Options): Awaitable<GifOptions>;

    public override async generate(options: Options): Promise<Blob> {
        const result = await this.generateGif(options);
        if (result instanceof Blob)
            return result;

        const gifOptions = await this.getGifOptions(options);

        const encoder = new GIFEncoder(gifOptions.width, gifOptions.height);
        const data = Readable.from(this.#getFrameData(result))
            .pipe(encoder.createWriteStream(gifOptions));
        const chunks: Uint8Array[] = [];
        for await (const chunk of data)
            chunks.push(chunk as Uint8Array);

        return new Blob(chunks, { type: 'image/gif' });
    }

    async * #getFrameData(source: AsyncIterable<Buffer | sharp.Sharp>): AsyncGenerator<Buffer> {
        for await (const frame of source) {
            if (frame instanceof Buffer)
                yield frame;
            else
                yield await frame.png().toBuffer();
        }
    }
}
