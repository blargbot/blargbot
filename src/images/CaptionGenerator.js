const { ImageGenerator } = require('./ImageGenerator');

class CaptionGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ url, input, font }) {
        let img = await this.getRemote(url);
        img.scaleToFit(800, 800);

        let height = img.bitmap.height;
        let width = img.bitmap.width;
        if (input.t) {
            let topcap = await this.renderText(input.t.join(' '), {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'north',
                fill: 'white',
                stroke: 'black',
                strokewidth: 16
            });
            img.composite(topcap, 0, 0);
        }
        if (input.b) {
            let botcap = await this.renderText(input.b.join(' '), {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'south',
                fill: 'white',
                stroke: 'black',
                strokewidth: 16
            });
            img.composite(botcap, 0, height / 6 * 5);
        }

        return await this.toBuffer(img, this.MIME_JPEG);
    }
}

module.exports = { CaptionGenerator };