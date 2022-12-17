import type { FreeOptions } from '@blargbot/image-types';
import sharp from 'sharp';

import type { GifOptions } from './base/InProcessGifGenerator.js';
import InProcessGifGenerator from './base/InProcessGifGenerator.js';

export default class FreeGenerator extends InProcessGifGenerator<FreeOptions> {
    readonly #frame1 = this.getLocalImage('free-frame1.png');
    readonly #frame2 = this.getLocalImage('free-frame2.png');

    protected override getGifOptions(): GifOptions {
        return {
            width: 400,
            height: 300,
            repeat: 0,
            delay: 50,
            quality: 10
        };
    }

    protected async * generateGif({ top, bottom }: FreeOptions): AsyncGenerator<sharp.Sharp> {
        const topCaption = await this.getText(top, {
            format: 'png',
            font: 'impact',
            fill: 'white',
            outline: ['black', 2.5],
            gravity: 'North',
            width: 380,
            height: 100
        });
        const bottomText = bottom ?? 'CLICK HERE TO\nFIND OUT HOW';
        const bottomCaption = await this.getText(bottomText, {
            format: 'png',
            font: 'arial',
            fill: 'white',
            gravity: 'Center',
            width: 380,
            height: 70
        });

        for (let i = 0; i < 6; i++) {
            yield sharp({ create: { width: 400, height: 300, channels: 4, background: 'black' } })
                .composite([
                    { input: i < 3 ? this.#frame1.path : this.#frame2.path },
                    { input: topCaption, left: i === 0 ? 10 : randInt(-25, 25), top: i === 0 ? 15 : randInt(0, 20) },
                    { input: bottomCaption, left: 10, top: 228 }
                ]);
        }
    }

}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (1 + max - min) + min);
}
