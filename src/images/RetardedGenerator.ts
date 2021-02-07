import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator';

export class RetardedGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ text, avatar }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string' || typeof avatar !== 'string')
            return null;

        const caption = await this.renderJimpText(text, {
            font: 'ARCENA.ttf',
            fill: 'black',
            stroke: 'white',
            strokewidth: '5',
            size: '272x60'
        });

        const img = await this.getLocalJimp('retarded.png');
        if (avatar) {
            const avatarImg = await this.getRemoteJimp(avatar);
            const smallAvatar = avatarImg.clone();
            smallAvatar.resize(74, 74);
            img.composite(smallAvatar, 166, 131);
            avatarImg.resize(171, 171);
            avatarImg.rotate(18);
            img.composite(avatarImg, 277, 32);
        }
        img.composite(caption, 268, 0);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}
