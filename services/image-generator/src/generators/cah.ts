import type { CahOptions } from '@blargbot/image-generator-client';
import type { OverlayOptions } from 'sharp';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class CardsAgainstHumanityGenerator extends InProcessSharpGenerator<CahOptions> {
    readonly #blackCard = this.getLocal('../images/cah-blackcard.png');
    readonly #whiteCard = this.getLocal('../images/cah-whitecard.png');

    protected async generateSharp({ white, black }: CahOptions): Promise<sharp.Sharp> {
        const cards = [
            { img: this.#blackCard, text: black, fill: 'white' },
            ...white.map(text => ({ img: this.#whiteCard, text, fill: 'black' }))
        ].map((c, i) => ({ ...c, left: i * 183, top: 0 }));

        const overlays = await Promise.all(cards.map<Promise<OverlayOptions[]>>(async c => [
            { input: await c.img.load(), left: c.left, top: c.top },
            {
                input: await this.getText(c.text, {
                    format: 'png',
                    font: 'arial',
                    fill: c.fill,
                    width: 144,
                    height: 190,
                    gravity: 'NorthWest'
                }),
                left: c.left + 19,
                top: c.top + 19
            }
        ]));

        return sharp({ create: { width: 183 * cards.length, height: 254, channels: 4, background: 'transparent' } })
            .composite(overlays.flat());
    }
}
