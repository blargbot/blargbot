import { BaseImageGenerator, randInt, Logger, DistortOptions, mapping } from '@image/core';
import { BetterColorAction } from '@jimp/plugin-color';

export class DistortGenerator extends BaseImageGenerator<'distort'> {
    public constructor(logger: Logger) {
        super('distort', logger, mapOptions);
    }

    public async executeCore({ avatar }: DistortOptions): Promise<Buffer> {
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

        return await this.generate(avatarImg, x => {
            x.out('-implode').out(`-${randInt(3, 10)}`);
            x.out('-roll').out(`+${horizRoll}+${vertiRoll}`);
            x.out('-swirl').out(`${randInt(0, 1) === 1 ? '+' : '-'}${randInt(120, 180)}`);
        });
    }
}

const mapOptions = mapping.object<DistortOptions>({
    avatar: mapping.string
});
