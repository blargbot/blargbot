import { randInt } from '@blargbot/core/utils';
import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { DistortOptions, ImageResult } from '@blargbot/image/types';
import sharp from 'sharp';

export class DistortGenerator extends BaseImageGenerator<'distort'> {
    public constructor(worker: ImageWorker) {
        super('distort', worker);
    }

    public async execute({ avatar }: DistortOptions): Promise<ImageResult> {
        const avatarImg = await sharp(await this.getRemote(avatar)).toBuffer({ resolveWithObject: true });
        const saturate = randInt(140, 180) * (randInt(0, 2) - 1);
        const horizRoll = randInt(0, avatarImg.info.width);
        const vertiRoll = randInt(0, avatarImg.info.height);

        return {
            data: await this.generate(avatarImg.data, x => {
                x.out('-modulate').out(`100,${saturate},${randInt(5, 95)}`);
                x.out('-implode').out(`-${randInt(3, 10)}`);
                x.out('-roll').out(`+${horizRoll}+${vertiRoll}`);
                x.out('-swirl').out(`${randInt(0, 1) === 1 ? '+' : '-'}${randInt(120, 180)}`);
            }, 'png'),
            fileName: 'distort.png'
        };
    }
}
