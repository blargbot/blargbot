import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ImageResult, RetardedOptions } from '@image/types';
import Jimp from 'jimp';

export class RetardedGenerator extends BaseImageGenerator<'retarded'> {
    public constructor(logger: Logger) {
        super('retarded', logger, mapOptions);
    }

    public async executeCore({ text, avatar }: RetardedOptions): Promise<ImageResult> {
        const caption = await this.renderJimpText(text, {
            font: 'ARCENA.ttf',
            fill: 'black',
            stroke: 'white',
            strokewidth: '5',
            size: '272x60'
        });

        const img = await this.getLocalJimp('retarded.png');
        if (avatar !== undefined) {
            const avatarImg = await this.getRemoteJimp(avatar);
            const smallAvatar = avatarImg.clone();
            smallAvatar.resize(74, 74);
            img.composite(smallAvatar, 166, 131);
            avatarImg.resize(171, 171);
            avatarImg.rotate(18);
            img.composite(avatarImg, 277, 32);
        }
        img.composite(caption, 268, 0);

        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'retarded.png'
        };
    }
}

const mapOptions = mapping.mapObject<RetardedOptions>({
    avatar: mapping.mapString,
    text: mapping.mapString
});
