const { ImageGenerator } = require('./ImageGenerator');
const { randInt } = require('../newbu');

class TriggeredGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ avatar, inverted, horizontal, vertical, sepia, blur, greyscale }) {
        let frameCount = 8;
        let frames = [];
        let avatarImg = await this.getRemote(avatar);
        avatarImg.resize(320, 320);
        if (inverted)
            avatarImg.invert();
        if (horizontal)
            avatarImg.flip(true, false);
        if (vertical)
            avatarImg.flip(false, true);
        if (sepia)
            avatarImg.sepia();
        if (blur)
            avatarImg.blur(10);
        if (greyscale)
            avatarImg.greyscale();

        let triggered = await this.getLocal(`triggered.png`);
        triggered.resize(280, 60);
        triggered.opacity(0.8);
        let overlay = await this.getLocal(`red.png`);

        let base = this.canvas(256, 256);

        let temp, x, y;
        for (let i = 0; i < frameCount; i++) {
            temp = base.clone();
            if (i == 0) {
                x = -16;
                y = -16;
            } else {
                x = -32 + (randInt(-16, 16));
                y = -32 + (randInt(-16, 16));
            }
            temp.composite(avatarImg, x, y);
            if (i == 0) {
                x = -10;
                y = 200;
            } else {
                x = -12 + (randInt(-8, 8));
                y = 200 + (randInt(-0, 12));
            }
            temp.composite(overlay, 0, 0);
            temp.composite(triggered, x, y);
            frames.push(temp.bitmap.data);
        }

        let gif = this.gif(256, 256, 20, 0);
        for (let frame of frames)
            gif.addFrame(frame);
        return await this.toBuffer(gif);
    }


}
module.exports = { TriggeredGenerator };
