import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ClydeOptions, ImageResult } from '@blargbot/image/types';
import sharp from 'sharp';

export class ClydeGenerator extends BaseImageGenerator<'clyde'> {
    public constructor(worker: ImageWorker) {
        super('clyde', worker);
    }

    public async execute({ text }: ClydeOptions): Promise<ImageResult> {
        const textImg = await this.trim(await this.renderText(text, {
            font: 'whitney.ttf',
            fontsize: 20,
            fill: '#ffffffB0',
            size: '714x1000'
        }));

        const { height = 0 } = await sharp(textImg).metadata();
        const result = sharp({ create: { width: 864, height: height + 165, channels: 4, background: '#33363bff' } })
            .composite([
                { input: this.getLocalResourcePath('clydeTop.png'), gravity: sharp.gravity.northwest },
                { input: textImg, left: 118, top: 83 },
                { input: this.getLocalResourcePath('clydeBottom.png'), gravity: sharp.gravity.southwest }
            ]);

        return {
            data: await result.png().toBuffer(),
            fileName: 'clyde.png'
        };
    }

}
