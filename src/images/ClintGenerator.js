const { ImageGenerator } = require('./ImageGenerator');

class ClintGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ image }) {
        let avatarImg = await this.getRemote(image);
        avatarImg.resize(700, 700);
        let bgImg = await this.generate(avatarImg, x => {
            x.out('-matte').out('-virtual-pixel').out('transparent');
            x.out('-distort');
            x.out('Perspective');
            x.out("0,0,0,132  700,0,330,0  0,700,0,530  700,700,330,700");
        });
        let foreground = await this.getLocal(`clint.png`);
        let img = this.canvas(1200, 675);
        img.composite(bgImg, 782, 0);

        img.composite(foreground, 0, 0);

        return await this.toBuffer(img);
    }
}

module.exports = { ClintGenerator };