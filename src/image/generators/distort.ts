import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { random } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function distort(request: ImageRequestData<'distort'>, context: GeneratorContext): Promise<ImageResponse> {
    const avatarImg = await sharp(await context.getRemote(request.imageUrl)).toUint8Array();
    return {
        data: await context.gmConvert(avatarImg.data, x => x
            .modulate(100, random.int(140, 180) * random.pick([-1, 1]), random.int(5, 95))
            .implode(-random.int(3, 10))
            .roll(random.int(0, avatarImg.info.width), random.int(0, avatarImg.info.height))
            .swirl(random.int(120, 180) * random.pick([-1, 1]))),
        fileName: 'distort.png'
    };
}
