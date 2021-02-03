const { ImageGenerator } = require('./ImageGenerator');
const { randInt } = require('../newbu');

class FreeGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ top, bottom }) {
        let topCaption = await this.renderText(top, {
            font: 'impact.ttf',
            fill: 'white',
            stroke: 'black',
            strokewidth: 5,
            gravity: 'north',
            size: '380x100'
        });
        let bottomText = bottom || 'CLICK HERE TO\nFIND OUT HOW';
        let bottomCaption = await this.renderText(bottomText, {
            font: 'arial.ttf',
            fill: 'white',
            gravity: 'center',
            size: '380x70'
        });

        let back1 = await this.getLocal('freefreefree0.png');
        let back2 = await this.getLocal('freefreefree1.png');

        let frameCount = 6;
        let frames = [];
        let base = this.canvas(400, 300);

        for (let i = 0; i < frameCount; i++) {
            let temp = base.clone();
            temp.composite(i < frameCount / 2 ? back1 : back2, 0, 0);
            temp.composite(topCaption, i == 0 ? 10 : randInt(-25, 25), i == 0 ? 15 : randInt(0, 20));
            temp.composite(bottomCaption, 10, 228);
            frames.push(temp.bitmap.data);
        }

        let gif = this.gif(400, 300, 50, 0);
        for (let frame of frames)
            gif.addFrame(frame);
        return this.toBuffer(gif);
    }

};

module.exports = { FreeGenerator };