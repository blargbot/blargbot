const { ImageGenerator } = require('./ImageGenerator');

class ArtGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ avatar }) {
        let avatarImg = await this.getRemote(avatar);
        avatarImg.resize(370, 370);
        let foreground = await this.getLocal(`art.png`);
        let img = this.canvas(1364, 1534);
        img.composite(avatarImg, 903, 92);
        img.composite(avatarImg, 903, 860);
        img.composite(foreground, 0, 0);

        return await this.toBuffer(img);
    }
}

module.exports = { ArtGenerator };