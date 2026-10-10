import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import type { OverlayOptions } from 'sharp';
import sharp from 'sharp';

import type { GeneratorContext, TextOptions } from '../GeneratorContext.js';

export async function caption(request: ImageRequestData<'caption'>, context: GeneratorContext): Promise<ImageResponse> {
    const imgData = await sharp(await context.getRemote(request.imageUrl))
        .resize(800, 800, { fit: 'outside' })
        .toBuffer({ resolveWithObject: true });

    const width = imgData.info.width;
    const height = imgData.info.height / 6;
    const overlays: Array<Promise<OverlayOptions>> = [];
    const textOptions: TextOptions = {
        font: request.font,
        width,
        height,
        fill: 'white',
        outline: ['black', 8]
    };

    if (request.top !== undefined) {
        overlays.push(context.renderText(request.top, { ...textOptions, gravity: 'North' }).then(text => ({
            input: asBuffer(text),
            gravity: sharp.gravity.north
        })));
    }
    if (request.bottom !== undefined) {
        overlays.push(context.renderText(request.bottom, { ...textOptions, gravity: 'South' }).then(text => ({
            input: asBuffer(text),
            gravity: sharp.gravity.south
        })));
    }
    const { data } = await sharp(imgData.data).composite(await Promise.all(overlays)).png().toUint8Array();

    return { data, fileName: 'caption.png' };
}
