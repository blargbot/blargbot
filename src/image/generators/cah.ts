import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function cah(request: ImageRequestData<'cah'>, context: GeneratorContext): Promise<ImageResponse> {
    const blackCard = await context.getLocal('blackcard.png').bytes();
    const whiteCard = await context.getLocal('whitecard.png').bytes();

    const cards = [
        { img: blackCard, text: request.black, fill: 'white' },
        ...request.white.map(text => ({ img: whiteCard, text, fill: 'black' }))
    ].map((c, i) => ({ ...c, left: i * 183, top: 0 }));

    const overlays = await Promise.all(cards.map(async c => [
        { input: c.img, left: c.left, top: c.top },
        {
            input: await context.renderText(c.text, {
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

    const { data } = await sharp({
        create: {
            width: 183 * cards.length,
            height: 254,
            channels: 4,
            background: 'transparent'
        }
    })
        .composite(overlays.flat().map(x => ({
            input: asBuffer(x.input),
            left: x.left,
            top: x.top
        })))
        .png()
        .toUint8Array();

    return { data, fileName: 'cah.png' };
}
