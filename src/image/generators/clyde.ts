import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ClydeOptions, ImageResult } from '@blargbot/image/types';
import Jimp from 'jimp';

export class ClydeGenerator extends BaseImageGenerator<'clyde'> {
    public constructor(worker: ImageWorker) {
        super('clyde', worker);
    }

    public async execute({ text }: ClydeOptions): Promise<ImageResult> {
        const originalText = await this.renderJimpText(text, {
            font: 'whitney.ttf',
            fontsize: 20,
            fill: '#ffffff',
            gravity: 'west',
            size: '714x1000'
        });
        const body = new Jimp(originalText.bitmap.width + 10, originalText.bitmap.height + 10);
        body.composite(originalText, 5, 5).autocrop().opacity(0.7);
        const height = 165 + body.bitmap.height;
        const canvas = new Jimp(864, height, 0x33363bff);
        const top = await this.getLocalJimp('clydeTop.png');
        const bottom = await this.getLocalJimp('clydeBottom.png');
        canvas.composite(top, 0, 0);
        canvas.composite(body, 118, 83);
        canvas.composite(bottom, 0, height - bottom.bitmap.height);

        return {
            data: await canvas.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'clyde.png'
        };
    }

}
