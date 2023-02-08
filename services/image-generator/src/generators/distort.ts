import type { DistortOptions } from '@blargbot/image-types';
import type gm from 'gm';

import InProcessMagickGenerator from './base/InProcessMagickGenerator.js';

export default class DistortGenerator extends InProcessMagickGenerator<DistortOptions> {
    protected override getImageFormat(): string {
        return 'png';
    }

    protected async generateMagick({ avatar }: DistortOptions): Promise<gm.State> {
        const { data: avatarImg, info } = await this.getRemoteImage(avatar, a => a.toBuffer({ resolveWithObject: true }));
        return this.imageMagick(avatarImg)
            .command('convert')
            .modulate(100, randInt(140, 180) * randChoose(-1, 1), randInt(5, 95))
            .implode(-randInt(3, 10))
            .roll(randInt(0, info.width), randInt(0, info.height))
            .swirl(randInt(120, 180) * randChoose(-1, 1));
    }
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (1 + max - min) + min);
}

function randChoose<T>(...options: T[]): T {
    return options[randInt(0, options.length - 1)];
}
