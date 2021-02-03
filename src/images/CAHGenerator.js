const { ImageGenerator } = require('./ImageGenerator');

class CAHGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ white, black }) {
        let blackCard = await this.getLocal('blackcard.png');
        let whiteCard = await this.getLocal('whitecard.png');

        let finalImg = this.canvas(183 * (white.length + 1), 254);
        let blackCaption = await this.renderText(black, {
            font: 'arial.ttf',
            fill: '#ffffff',
            size: '144x190',
            gravity: 'northwest'
        });
        finalImg.composite(blackCard, 0, 0);
        finalImg.composite(blackCaption, 19, 19);

        for (let i = 0; i < white.length; i++) {
            let whiteCaption = await this.renderText(white[i], {
                font: 'arial.ttf',
                fill: 'black',
                size: '144x190',
                gravity: 'northwest'
            });
            finalImg.composite(whiteCard, 183 * (i + 1), 0);
            finalImg.composite(whiteCaption, 183 * (i + 1) + 19, 19);
        }

        return await this.toBuffer(finalImg);
    }
}

module.exports = { CAHGenerator };