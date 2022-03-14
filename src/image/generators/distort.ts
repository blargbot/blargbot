import { randInt } from '@blargbot/core/utils';
import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { DistortOptions, ImageResult } from '@blargbot/image/types';
import { BetterColorAction } from '@jimp/plugin-color';

export class DistortGenerator extends BaseImageGenerator<'distort'> {
    public constructor(worker: ImageWorker) {
        super('distort', worker);
    }

    public async execute({ avatar }: DistortOptions): Promise<ImageResult> {
        // 344x410
        // 28 - 70
        // 400x620
        const avatarImg = await this.getRemoteJimp(avatar);
        const filters: BetterColorAction[] = [
            { apply: randInt(0, 1) === 1 ? 'desaturate' : 'saturate', params: [randInt(40, 80)] },
            { apply: 'hue', params: [randInt(10, 350)] }
        ];
        avatarImg.color(filters);
        const horizRoll = randInt(0, avatarImg.bitmap.width);
        const vertiRoll = randInt(0, avatarImg.bitmap.height);

        return {
            data: await this.generate(avatarImg, x => {
                x.out('-implode').out(`-${randInt(3, 10)}`);
                x.out('-roll').out(`+${horizRoll}+${vertiRoll}`);
                x.out('-swirl').out(`${randInt(0, 1) === 1 ? '+' : '-'}${randInt(120, 180)}`);
            }, 'png'),
            fileName: 'distort.png'
        };
    }
}
