import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function art(request: ImageRequestData<'art'>, context: GeneratorContext): Promise<ImageResponse> {
    const avatarImg = await sharp(await context.getRemote(request.imageUrl))
        .resize(370, 370)
        .toBuffer();

    const { data } = await sharp({
        create: {
            width: 1364,
            height: 1534,
            channels: 4,
            background: 'transparent'
        }
    })
        .composite([
            { input: avatarImg, left: 903, top: 92 },
            { input: avatarImg, left: 903, top: 860 },
            { input: context.getLocal('art.png').path }
        ])
        .png().toUint8Array();

    return { data, fileName: 'sobeautifulstan.png' };
}
