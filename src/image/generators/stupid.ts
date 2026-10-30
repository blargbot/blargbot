import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function stupid(request: ImageRequestData<'stupid'>, context: GeneratorContext): Promise<ImageResponse> {
    const overlays = [];
    if (request.imageUrl !== undefined) {
        const avatarImg = sharp(await context.getRemote(request.imageUrl)).ensureAlpha();
        const smallAvatar = avatarImg.clone().resize(74, 74);
        const bigAvatar = avatarImg.clone().resize(171, 171).rotate(18, { background: 'transparent' });
        overlays.push(
            smallAvatar.toUint8Array().then(x => ({ input: asBuffer(x.data), left: 166, top: 131 })),
            bigAvatar.toUint8Array().then(x => ({ input: asBuffer(x.data), left: 277, top: 32 }))
        );
    }

    const { data } = await sharp(context.getLocal('stupid.png').path)
        .composite([
            ...await Promise.all(overlays),
            {
                input: asBuffer(await context.renderText(request.text, {
                    font: 'ARCENA.ttf',
                    fill: 'black',
                    outline: ['white', 2.5],
                    width: 272,
                    height: 60
                })),
                left: 268,
                top: 0
            }
        ])
        .png()
        .toUint8Array();

    return { data, fileName: 'stupid.png' };
}
