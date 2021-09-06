import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ImageWorker } from '@image/ImageWorker';
import { ImageResult, StarVsTheForcesOfOptions } from '@image/types';
import { BetterColorAction } from '@jimp/plugin-color';
import colorThief from 'color-thief-jimp';
import Jimp from 'jimp';

export class StarVsTheForcesOfGenerator extends BaseImageGenerator<'starVsTheForcesOf'> {
    public constructor(worker: ImageWorker) {
        super('starVsTheForcesOf', worker);
    }

    public async execute({ avatar }: StarVsTheForcesOfOptions): Promise<ImageResult> {
        const avatarImg = await this.getRemoteJimp(avatar);
        avatarImg.resize(700, 700);
        const color = colorThief.getColor(avatarImg);
        //color = color.map(a => a / 2);
        const lowest = Math.min(color[0], color[1], color[2]);
        const mappedColor = color.map(a => Math.min(a - lowest, 32));
        this.worker.logger.debug(mappedColor);
        const bgImg = await this.generateJimp(avatarImg, x => {
            x.out('-matte').out('-virtual-pixel').out('transparent');
            x.out('-extent');
            x.out('1468x1656');
            x.out('-distort');
            x.out('Perspective');
            x.out('0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656');
        });
        bgImg.resize(734, 828);

        const foreground = await this.getLocalJimp('starvstheforcesof.png');
        foreground.resize(960, 540);
        const actions: BetterColorAction[] = [];
        if (mappedColor[0] > 0)
            actions.push({ apply: 'red', params: [mappedColor[0]] });
        if (mappedColor[1] > 0)
            actions.push({ apply: 'green', params: [mappedColor[1]] });
        if (mappedColor[2] > 0)
            actions.push({ apply: 'blue', params: [mappedColor[2]] });
        foreground.color(actions);
        const img = new Jimp(960, 540);
        bgImg.crop(0, 104, 600, 540);
        img.composite(bgImg, 430, 0);
        img.composite(foreground, 0, 0);

        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'starvstheforcesof.png'
        };
    }
}
