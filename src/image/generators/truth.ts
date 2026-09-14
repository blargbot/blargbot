import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function truth(request: ImageRequestData<'truth'>, context: GeneratorContext): Promise<ImageResponse> {
    const { data } = await sharp(context.getLocal('truth.png').path)
        .composite([{
            input: asBuffer(await context.renderText(request.text, {
                font: 'AnnieUseYourTelescope.ttf',
                width: 96,
                height: 114,
                gravity: 'North'
            })),
            left: 95,
            top: 289
        }])
        .png()
        .toUint8Array();

    return { data, fileName: 'truth.png' };
}
