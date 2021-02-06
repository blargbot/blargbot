import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class CAHGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ white, black }: JObject) {
        if (!Array.isArray(white) || typeof black !== 'string')
            return;

        let blackCard = await this.getLocalJimp('blackcard.png');
        let whiteCard = await this.getLocalJimp('whitecard.png');

        let finalImg = new Jimp(183 * (white.length + 1), 254);
        let blackCaption = await this.renderJimpText(black, {
            font: 'arial.ttf',
            fill: '#ffffff',
            size: '144x190',
            gravity: 'northwest'
        });
        finalImg.composite(blackCard, 0, 0);
        finalImg.composite(blackCaption, 19, 19);

        for (let i = 0; i < white.length; i++) {
            let w = white[i];
            if (typeof w !== 'string')
                continue;

            let whiteCaption = await this.renderJimpText(w, {
                font: 'arial.ttf',
                fill: 'black',
                size: '144x190',
                gravity: 'northwest'
            });
            finalImg.composite(whiteCard, 183 * (i + 1), 0);
            finalImg.composite(whiteCaption, 183 * (i + 1) + 19, 19);
        }

        return await finalImg.getBufferAsync(Jimp.MIME_PNG);
    }
}
