import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class ArtGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ avatar }: JObject) {
        if (typeof avatar !== 'string')
            return null;

        let avatarImg = await this.getRemoteJimp(avatar);
        avatarImg.resize(370, 370);
        let foreground = await this.getLocalJimp(`art.png`);
        let img = new Jimp(1364, 1534);
        img.composite(avatarImg, 903, 92);
        img.composite(avatarImg, 903, 860);
        img.composite(foreground, 0, 0);
        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}
