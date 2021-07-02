import Jimp from 'jimp';
import { BaseImageGenerator } from '../core';

export class ArtGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ avatar }: JObject): Promise<Buffer | null> {
        if (typeof avatar !== 'string')
            return null;

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
