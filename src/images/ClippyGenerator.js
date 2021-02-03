const { ImageGenerator } = require('./ImageGenerator');

class ClippyGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        let caption = await this.renderText(text, {
            font: 'arial.ttf',
            size: '290x130',
            gravity: 'North'
        });
        let img = await this.getLocal(`clippy.png`);
        img.composite(caption, 28, 36);
        return await this.toBuffer(img);
    }
}

module.exports = { ClippyGenerator };