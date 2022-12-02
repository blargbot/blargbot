import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator.js';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { ImageResult, PixelateOptions } from '@blargbot/image/types.js';
import sharp from 'sharp';

export class PixelateGenerator extends BaseImageGenerator<'pixelate'> {
    public constructor(worker: ImageWorker) {
        super('pixelate', worker);
    }

    public async execute({ url, scale }: PixelateOptions): Promise<ImageResult> {
        const pixelated = await sharp(await this.getRemote(url))
            .resize(scale, scale, { fit: 'inside' })
            .toBuffer();

        const result = sharp(pixelated)
            .resize(256, 256, { fit: 'outside', kernel: 'nearest' });

        return {
            data: await result.png().toBuffer(),
            fileName: 'pixelate.png'
        };
    }
}
