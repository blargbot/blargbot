import { randInt } from '@blargbot/core/utils/index.js';
import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';
import type { FreeOptions, ImageResult } from '@blargbot/image/types.js';
import sharp from 'sharp';

export class FreeGenerator extends BaseImageGenerator<'free'> {
    public constructor(worker: ImageWorker) {
        super('free', worker);
    }

    public async execute({ top, bottom }: FreeOptions): Promise<ImageResult> {
        const topCaption = await this.renderText(top, {
            font: 'impact.ttf',
            fill: 'white',
            outline: ['black', 2.5],
            gravity: 'North',
            width: 380,
            height: 100
        });
        const bottomText = bottom ?? 'CLICK HERE TO\nFIND OUT HOW';
        const bottomCaption = await this.renderText(bottomText, {
            font: 'arial.ttf',
            fill: 'white',
            gravity: 'Center',
            width: 380,
            height: 70
        });

        const back1 = this.getLocalImg('freefreefree0.png').location;
        const back2 = this.getLocalImg('freefreefree1.png').location;

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
