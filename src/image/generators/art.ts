import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ArtOptions, ImageResult } from '@blargbot/image/types';
import sharp from 'sharp';

export class ArtGenerator extends BaseImageGenerator<'art'> {
    public constructor(worker: ImageWorker) {
        super('art', worker);
    }

    public async execute({ avatar }: ArtOptions): Promise<ImageResult> {
        const avatarImg = await sharp(await this.getRemote(avatar))
            .resize(370, 370)
            .toBuffer();

        const img = sharp({ create: { width: 1364, height: 1534, channels: 4, background: 'transparent' } })
            .composite([
                { input: avatarImg, left: 903, top: 92 },
                { input: avatarImg, left: 903, top: 860 },
                { input: this.getLocalResourcePath('art.png') }
            ]);
        return {
            data: await img.png().toBuffer(),
            fileName: 'sobeautifulstan.png'
        };
    }
}
