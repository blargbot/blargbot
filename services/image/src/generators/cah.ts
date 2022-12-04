import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';
import type { CahOptions, ImageResult } from '@blargbot/image/types.js';
import type { OverlayOptions } from 'sharp';
import sharp from 'sharp';

export class CahGenerator extends BaseImageGenerator<'cah'> {
    public constructor(worker: ImageWorker) {
        super('cah', worker);
    }

    public async execute({ white, black }: CahOptions): Promise<ImageResult> {
        const blackCard = await this.getLocalImg('blackcard.png').load();
        const whiteCard = await this.getLocalImg('whitecard.png').load();

        const cards = [
            { img: blackCard, text: black, fill: 'white' },
            ...white.map(text => ({ img: whiteCard, text, fill: 'black' }))
        ].map((c, i) => ({ ...c, left: i * 183, top: 0 }));

        const overlays = await Promise.all(cards.map<Promise<OverlayOptions[]>>(async c => [
            { input: c.img, left: c.left, top: c.top },
            {
                input: await this.renderText(c.text, {
                    font: 'arial.ttf',
                    fill: c.fill,
                    width: 144,
                    height: 190,
                    gravity: 'NorthWest'
                }),
                left: c.left + 19,
                top: c.top + 19
            }
        ]));

        const result = sharp({ create: { width: 183 * cards.length, height: 254, channels: 4, background: 'transparent' } })
            .composite(overlays.flat());

        return {
            data: await result.png().toBuffer(),
            fileName: 'cah.png'
        };
    }
}
