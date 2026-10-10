import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function clyde(request: ImageRequestData<'clyde'>, context: GeneratorContext): Promise<ImageResponse> {
    const textImg = await context.renderText(request.text, {
        font: 'whitney.ttf',
        fontsize: 20,
        fill: '#ffffffB0',
        gravity: 'NorthWest',
        width: 714
    });

    const { height = 0 } = await sharp(textImg).metadata();
    const { data } = await sharp({ create: { width: 864, height: height + 154, channels: 4, background: '#33363bff' } })
        .composite([
            { input: context.getLocal('clydeTop.png').path, gravity: sharp.gravity.northwest },
            { input: asBuffer(textImg), left: 118, top: 78 },
            { input: context.getLocal('clydeBottom.png').path, gravity: sharp.gravity.southwest }
        ])
        .png()
        .toUint8Array();

    return { data, fileName: 'clyde.png' };
}
