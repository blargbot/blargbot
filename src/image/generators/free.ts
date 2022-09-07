import { randInt } from '@blargbot/core/utils';
import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { FreeOptions, ImageResult } from '@blargbot/image/types';
import sharp from 'sharp';

export class FreeGenerator extends BaseImageGenerator<'free'> {
    public constructor(worker: ImageWorker) {
        super('free', worker);
    }

    public async execute({ top, bottom }: FreeOptions): Promise<ImageResult> {
        const topCaption = await this.renderText(top, {
            font: 'impact.ttf',
            fill: 'white',
            stroke: 'black',
            strokewidth: '5',
            gravity: 'north',
            size: '380x100'
        });
        const bottomText = bottom ?? 'CLICK HERE TO\nFIND OUT HOW';
        const bottomCaption = await this.renderText(bottomText, {
            font: 'arial.ttf',
            fill: 'white',
            gravity: 'center',
            size: '380x70'
        });

        const back1 = this.getLocalResourcePath('freefreefree0.png');
        const back2 = this.getLocalResourcePath('freefreefree1.png');

        const frame = sharp({ create: { width: 400, height: 300, channels: 4, background: 'black' } });
        const frames: Array<Promise<Buffer>> = [];
        for (let i = 0; i < 6; i++) {
            frames.push(frame.clone().composite([
                { input: i < 3 ? back1 : back2 },
                { input: topCaption, left: i === 0 ? 10 : randInt(-25, 25), top: i === 0 ? 15 : randInt(0, 20) },
                { input: bottomCaption, left: 10, top: 228 }
            ]).toBuffer());
        }

        return {
            data: await this.toGif(await Promise.all(frames), { width: 400, height: 300, repeat: 0, delay: 50, quality: 10 }),
            fileName: 'free.gif'
        };
    }

}
