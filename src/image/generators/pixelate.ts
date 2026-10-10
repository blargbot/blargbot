import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function pixelate(request: ImageRequestData<'pixelate'>, context: GeneratorContext): Promise<ImageResponse> {
    const pixelated = await sharp(await context.getRemote(request.imageUrl))
        .resize(request.scale, request.scale, { fit: 'inside' })
        .toBuffer();

    const { data } = await sharp(pixelated)
        .resize(256, 256, { fit: 'outside', kernel: 'nearest' })
        .png()
        .toUint8Array();

    return { data, fileName: 'pixelate.png' };
}
