import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ImageResult, PixelateOptions } from '@blargbot/image/types';
import Jimp from 'jimp';

export class PixelateGenerator extends BaseImageGenerator<'pixelate'> {
    public constructor(worker: ImageWorker) {
        super('pixelate', worker);
    }

    public async execute({ url, scale }: PixelateOptions): Promise<ImageResult> {
        const image = await this.getRemoteJimp(url);
        if (image.bitmap.width >= image.bitmap.height) {
            image.resize(scale, Jimp.AUTO);
            image.resize(256, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
        } else {
            image.resize(Jimp.AUTO, scale);
            image.resize(Jimp.AUTO, 256, Jimp.RESIZE_NEAREST_NEIGHBOR);
        }

        return {
            data: await image.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'pixelate.png'
        };
    }
}
