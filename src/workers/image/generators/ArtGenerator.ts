import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ArtOptions } from '@image/types';
import Jimp from 'jimp';

export class ArtGenerator extends BaseImageGenerator<'art'> {
    public constructor(logger: Logger) {
        super('art', logger, mapOptions);
    }

    public async executeCore({ avatar }: ArtOptions): Promise<Buffer> {
        const avatarImg = await this.getRemoteJimp(avatar);
        avatarImg.resize(370, 370);
        const foreground = await this.getLocalJimp('art.png');
        const img = new Jimp(1364, 1534);
        img.composite(avatarImg, 903, 92);
        img.composite(avatarImg, 903, 860);
        img.composite(foreground, 0, 0);
        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}

const mapOptions = mapping.mapObject<ArtOptions>({
    avatar: mapping.mapString
});
