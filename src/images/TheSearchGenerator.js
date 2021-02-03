const { ImageGenerator } = require('./ImageGenerator');

class TheSearchGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        let caption = await this.renderText(text, {
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        });

        let img = await this.getLocal(`thesearch.png`);
        img.composite(caption, 60, 331);

        return await this.toBuffer(img);
    }


}
module.exports = { TheSearchGenerator };
