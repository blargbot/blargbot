const { ImageGenerator } = require('./ImageGenerator');

class TruthGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        let caption = await this.renderText(text, {
            font: 'AnnieUseYourTelescope.ttf',
            size: '96x114',
            gravity: 'North'
        });
        let img = await this.getLocal(`truth.png`);
        img.composite(caption, 95, 289);

        return await this.toBuffer(img);
    }
}

module.exports = { TruthGenerator };