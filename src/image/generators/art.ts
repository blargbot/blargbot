import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ArtOptions, ImageResult } from '@blargbot/image/types';
import Jimp from 'jimp';

export class ArtGenerator extends BaseImageGenerator<'art'> {
    public constructor(worker: ImageWorker) {
        super('art', worker);
    }

    public async execute({ avatar }: ArtOptions): Promise<ImageResult> {
        const avatarImg = await this.getRemoteJimp(avatar);
        avatarImg.resize(370, 370);
        const foreground = await this.getLocalJimp('art.png');
        const img = new Jimp(1364, 1534);
        img.composite(avatarImg, 903, 92);
        img.composite(avatarImg, 903, 860);
        img.composite(foreground, 0, 0);
        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'sobeautifulstan.png'
        };
    }
}
