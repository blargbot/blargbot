import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { CahOptions, ImageResult } from '@blargbot/image/types';
import Jimp from 'jimp';

export class CahGenerator extends BaseImageGenerator<'cah'> {
    public constructor(worker: ImageWorker) {
        super('cah', worker);
    }

    public async execute({ white, black }: CahOptions): Promise<ImageResult> {
        const blackCard = await this.getLocalJimp('blackcard.png');
        const whiteCard = await this.getLocalJimp('whitecard.png');

        const finalImg = new Jimp(183 * (white.length + 1), 254);
        const blackCaption = await this.renderJimpText(black, {
            font: 'arial.ttf',
            fill: '#ffffff',
            size: '144x190',
            gravity: 'northwest'
        });
        finalImg.composite(blackCard, 0, 0);
        finalImg.composite(blackCaption, 19, 19);

        for (let i = 0; i < white.length; i++) {
            const w = white[i];
            if (typeof w !== 'string')
                continue;

            const whiteCaption = await this.renderJimpText(w, {
                font: 'arial.ttf',
                fill: 'black',
                size: '144x190',
                gravity: 'northwest'
            });
            finalImg.composite(whiteCard, 183 * (i + 1), 0);
            finalImg.composite(whiteCaption, 183 * (i + 1) + 19, 19);
        }

        return {
            data: await finalImg.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'cah.png'
        };
    }
}
