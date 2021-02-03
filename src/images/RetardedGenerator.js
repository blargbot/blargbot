const { ImageGenerator } = require('./ImageGenerator');

class RetardedGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }
    async execute({ text, avatar }) {
        let caption = await this.renderText(text, {
            font: 'ARCENA.ttf',
            fill: 'black',
            stroke: 'white',
            strokewidth: 5,
            size: '272x60'
        });

        let img = await this.getLocal(`retarded.png`);
        if (avatar) {
            let avatarImg = await this.getRemote(avatar);
            let smallAvatar = avatarImg.clone();
            smallAvatar.resize(74, 74);
            img.composite(smallAvatar, 166, 131);
            avatarImg.resize(171, 171);
            avatarImg.rotate(18);
            img.composite(avatarImg, 277, 32);
        }
        img.composite(caption, 268, 0);

        return await this.toBuffer(img);
    }
}

module.exports = { RetardedGenerator };