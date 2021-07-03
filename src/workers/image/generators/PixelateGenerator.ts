import { BaseImageGenerator, Logger, mapping, PixelateOptions } from '../core';
import Jimp from 'jimp';

export class PixelateGenerator extends BaseImageGenerator<'pixelate'> {
    public constructor(logger: Logger) {
        super('pixelate', logger, mapOptions);
    }

    public async executeCore({ url, scale }: PixelateOptions): Promise<Buffer> {
        const image = await this.getRemoteJimp(url);
        if (image.bitmap.width >= image.bitmap.height) {
            image.resize(scale, Jimp.AUTO);
            image.resize(256, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
        } else {
            image.resize(Jimp.AUTO, scale);
            image.resize(Jimp.AUTO, 256, Jimp.RESIZE_NEAREST_NEIGHBOR);
        }

        return await image.getBufferAsync(Jimp.MIME_PNG);
    }
}

const mapOptions = mapping.object<PixelateOptions>({
    scale: mapping.number,
    url: mapping.string
});
