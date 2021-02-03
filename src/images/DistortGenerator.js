const { ImageGenerator } = require('./ImageGenerator');
const { randInt } = require('../newbu');

class DistortGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ avatar }) {
        // 344x410
        // 28 - 70
        // 400x620
        let avatarImg = await this.getRemote(avatar);
        const filters = [
            { apply: randInt(0, 1) == 1 ? 'desaturate' : 'saturate', params: [randInt(40, 80)] },
            { apply: 'spin', params: [randInt(10, 350)] }
        ];
        avatarImg.color(filters);
        let horizRoll = randInt(0, avatarImg.bitmap.width),
            vertiRoll = randInt(0, avatarImg.bitmap.height);

        return await this.generateBuffer(avatarImg, x => {
            x.out('-implode').out(`-${randInt(3, 10)}`);
            x.out('-roll').out(`+${horizRoll}+${vertiRoll}`);
            x.out('-swirl').out(`${randInt(0, 1) == 1 ? '+' : '-'}${randInt(120, 180)}`);
        });
    }
}

module.exports = { DistortGenerator };
