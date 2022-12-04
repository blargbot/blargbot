import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';
import type { ClydeOptions, ImageResult } from '@blargbot/image/types.js';
import sharp from 'sharp';

export class ClydeGenerator extends BaseImageGenerator<'clyde'> {
    public constructor(worker: ImageWorker) {
        super('clyde', worker);
    }

    public async execute({ text }: ClydeOptions): Promise<ImageResult> {
        const textImg = await this.renderText(text, {
            font: 'whitney.ttf',
            fontsize: 20,
            fill: '#ffffffB0',
            gravity: 'NorthWest',
            width: 714
        });

        const { height = 0 } = await sharp(textImg).metadata();
        const result = sharp({ create: { width: 864, height: height + 154, channels: 4, background: '#33363bff' } })
            .composite([
                { input: this.getLocalImg('clydeTop.png').location, gravity: sharp.gravity.northwest },
                { input: textImg, left: 118, top: 78 },
                { input: this.getLocalImg('clydeBottom.png').location, gravity: sharp.gravity.southwest }
            ]);

        return {
            data: await result.png().toBuffer(),
            fileName: 'clyde.png'
        };
    }

}
