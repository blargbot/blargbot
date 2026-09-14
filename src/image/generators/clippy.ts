import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function clippy(request: ImageRequestData<'clippy'>, context: GeneratorContext): Promise<ImageResponse> {
    const { data } = await sharp(context.getLocal('clippy.png').path)
        .composite([{
            input: asBuffer(await context.renderText(request.text, {
                font: 'arial.ttf',
                width: 290,
                height: 130,
                gravity: 'North'
            })),
            left: 28,
            top: 36
        }])
        .png()
        .toUint8Array();

    return { data, fileName: 'clippy.png' };
}
