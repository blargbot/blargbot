const { ImageGenerator } = require('./ImageGenerator');

class ShitGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text, plural }) {
        let caption = await this.renderText(text, {
            font: 'animeace.ttf',
            size: '200x160',
            gravity: 'South'
        });
        let img = await this.getLocal(`SHIT${plural ? 'S' : ''}.png`);
        img.composite(caption, 810, 31);

        return await this.toBuffer(img);
    }
}

module.exports = { ShitGenerator };