import type { ClydeOptions } from '@blargbot/image-generator-client';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class ClydeGenerator extends InProcessSharpGenerator<ClydeOptions> {
    readonly #top = this.getLocalImage('clyde-top.png');
    readonly #bottom = this.getLocalImage('clyde-bottom.png');

    protected async generateSharp({ text }: ClydeOptions): Promise<sharp.Sharp> {
        const textImg = await this.getText(text, {
            format: 'png',
            font: 'whitney',
            fontsize: 20,
            fill: '#ffffffB0',
            gravity: 'NorthWest',
            width: 714
        });

        const { height = 0 } = await sharp(textImg).metadata();
        return sharp({ create: { width: 864, height: height + 154, channels: 4, background: '#33363bff' } })
            .composite([
                { input: this.#top.path, gravity: sharp.gravity.northwest },
                { input: textImg, left: 118, top: 78 },
                { input: this.#bottom.path, gravity: sharp.gravity.southwest }
            ]);
    }
}
