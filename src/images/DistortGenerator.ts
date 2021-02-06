import { BaseImageGenerator } from '../structures/BaseImageGenerator'
import { randInt } from '../newbu';
import { BetterColorAction } from '@Jimp/plugin-color';

export class DistortGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ avatar }: JObject) {
        if (typeof avatar !== 'string')
            return null;
        // 344x410
        // 28 - 70
        // 400x620
        let avatarImg = await this.getRemoteJimp(avatar);
        const filters: BetterColorAction[] = [
            { apply: randInt(0, 1) == 1 ? 'desaturate' : 'saturate', params: [randInt(40, 80)] },
            { apply: 'hue', params: [randInt(10, 350)] }
        ];
        avatarImg.color(filters);
        let horizRoll = randInt(0, avatarImg.bitmap.width),
            vertiRoll = randInt(0, avatarImg.bitmap.height);

        return await this.generate(avatarImg, x => {
            x.out('-implode').out(`-${randInt(3, 10)}`);
            x.out('-roll').out(`+${horizRoll}+${vertiRoll}`);
            x.out('-swirl').out(`${randInt(0, 1) == 1 ? '+' : '-'}${randInt(120, 180)}`);
        });
    }
}

