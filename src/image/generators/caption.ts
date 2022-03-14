import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { CaptionOptions, ImageResult } from '@blargbot/image/types';
import Jimp from 'jimp';

export class CaptionGenerator extends BaseImageGenerator<'caption'> {
    public constructor(worker: ImageWorker) {
        super('caption', worker);
    }

    public async execute({ url, input, font }: CaptionOptions): Promise<ImageResult> {
        const img = await this.getRemoteJimp(url);
        img.scaleToFit(800, 800);

        const height = img.bitmap.height;
        const width = img.bitmap.width;
        if (input.top !== undefined) {
            const topcap = await this.renderJimpText(input.top, {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'north',
                fill: 'white',
                stroke: 'black',
                strokewidth: '16'
            });
            img.composite(topcap, 0, 0);
        }
        if (input.bottom !== undefined) {
            const botcap = await this.renderJimpText(input.bottom, {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'south',
                fill: 'white',
                stroke: 'black',
                strokewidth: '16'
            });
            img.composite(botcap, 0, height / 6 * 5);
        }

        return {
            data: await img.getBufferAsync(Jimp.MIME_JPEG),
            fileName: 'caption.jpeg'
        };
    }
}
