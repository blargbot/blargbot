const { ImageGenerator } = require('./ImageGenerator');

class ClydeGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        let originalText = await this.renderText(text, {
            font: 'whitney.ttf',
            fontsize: 20,
            fill: '#ffffff',
            gravity: 'west'
        });
        let body = this.canvas(originalText.bitmap.width + 10, originalText.bitmap.height + 10);
        body.composite(originalText, 5, 5).autocrop().opacity(0.7);
        let height = 165 + body.bitmap.height;
        let canvas = this.canvas(864, height, 0x33363bff);
        let top = await this.getLocal(`clydeTop.png`);
        let bottom = await this.getLocal(`clydeBottom.png`);
        canvas.composite(top, 0, 0);
        canvas.composite(body, 118, 83);
        canvas.composite(bottom, 0, height - bottom.bitmap.height);

        return await this.toBuffer(canvas);
    }


}
module.exports = { ClydeGenerator };
