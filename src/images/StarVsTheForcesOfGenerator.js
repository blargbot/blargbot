const colorThief = require('color-thief-jimp');
const { ImageGenerator } = require('./ImageGenerator');

class StarVsTheForcesOfGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ avatar }) {
        let avatarImg = await this.getRemote(avatar);
        avatarImg.resize(700, 700);
        let color = colorThief.getColor(avatarImg);
        //color = color.map(a => a / 2);
        let lowest = Math.min(color[0], color[1], color[2]);
        color = color.map(a => Math.min(a - lowest, 32));
        this.logger.debug(color);
        let bgImg = await this.generate(avatarImg, x => {
            x.out('-matte').out('-virtual-pixel').out('transparent');
            x.out('-extent');
            x.out('1468x1656');
            x.out('-distort');
            x.out('Perspective');
            x.out("0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656");
        });
        bgImg.resize(734, 828);

        let foreground = await this.getLocal(`starvstheforcesof.png`);
        foreground.resize(960, 540);
        let actions = [];
        if (color[0] > 0)
            actions.push({ apply: 'red', params: [color[0]] });
        if (color[1] > 0)
            actions.push({ apply: 'green', params: [color[1]] });
        if (color[2] > 0)
            actions.push({ apply: 'blue', params: [color[2]] });
        foreground.color(actions);
        let img = this.canvas(960, 540);
        bgImg.crop(0, 104, 600, 540);
        img.composite(bgImg, 430, 0);
        img.composite(foreground, 0, 0);

        return await this.toBuffer(img);
    }


}
module.exports = { StarVsTheForcesOfGenerator };
