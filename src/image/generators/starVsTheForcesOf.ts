import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function starVsTheForcesOf(request: ImageRequestData<'starVsTheForcesOf'>, context: GeneratorContext): Promise<ImageResponse> {
    const avatarImg = sharp(await context.getRemote(request.imageUrl)).resize(700, 700);
    const { data: avatarImgData } = await avatarImg.toUint8Array();

    const bgImg = await context.gmConvert(avatarImgData, x => x
        .matte()
        .virtualPixel('transparent')
        .extent(1468, 1656)
        .out('-distort', 'Perspective', '0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656')
        .resize(734, 828)
        .crop(600, 540, 0, 104)
    );

    const stats = await avatarImg.stats();
    const channels = stats.channels.slice(0, 3).map(c => c.mean);
    const min = Math.min(...channels);
    const max = Math.max(...channels);
    const scale = channels.map(() => 1);
    const shift = channels.map(c => (c - min) * 32 / (max - min)); // bring all channels into range 0 - 32
    const foreground = sharp(context.getLocal('starvstheforcesof.png').path)
        .resize(960, 540)
        .linear(scale.map(Math.round), shift.map(Math.round));

    const { data } = await sharp({ create: { width: 960, height: 540, channels: 4, background: 'transparent' } })
        .composite([
            { input: asBuffer(bgImg), left: 430, top: 0 },
            { input: await foreground.toBuffer(), left: 0, top: 0 }
        ])
        .png()
        .toUint8Array();

    return { data, fileName: 'starvstheforcesof.png' };
}
