import { randChoose, randInt } from '@blargbot/core/utils/index.js';
import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator.js';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { DistortOptions, ImageResult } from '@blargbot/image/types.js';
import sharp from 'sharp';

export class DistortGenerator extends BaseImageGenerator<'distort'> {
    public constructor(worker: ImageWorker) {
        super('distort', worker);
    }

    public async execute({ avatar }: DistortOptions): Promise<ImageResult> {
        const avatarImg = await sharp(await this.getRemote(avatar)).toBuffer({ resolveWithObject: true });
        return {
            data: await this.gmConvert(avatarImg.data, x => x
                .modulate(100, randInt(140, 180) * randChoose([-1, 1]), randInt(5, 95))
                .implode(-randInt(3, 10))
                .roll(randInt(0, avatarImg.info.width), randInt(0, avatarImg.info.height))
                .swirl(randInt(120, 180) * randChoose([-1, 1]))),
            fileName: 'distort.png'
        };
    }
}
