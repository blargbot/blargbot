import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer, random } from '@blargbot/util';
import sharp from 'sharp';

import type { GeneratorContext } from '../GeneratorContext.js';

export async function free(request: ImageRequestData<'free'>, context: GeneratorContext): Promise<ImageResponse> {
    const topCaption = await context.renderText(request.top, {
        font: 'impact.ttf',
        fill: 'white',
        outline: ['black', 2.5],
        gravity: 'North',
        width: 380,
        height: 100
    });
    const bottomText = request.bottom ?? 'CLICK HERE TO\nFIND OUT HOW';
    const bottomCaption = await context.renderText(bottomText, {
        font: 'arial.ttf',
        fill: 'white',
        gravity: 'Center',
        width: 380,
        height: 70
    });

    const back1 = context.getLocal('freefreefree0.png').path;
    const back2 = context.getLocal('freefreefree1.png').path;

    const frame = sharp({ create: { width: 400, height: 300, channels: 4, background: 'black' } });
    const frames: Array<Promise<{ data: Uint8Array; }>> = [];
    for (let i = 0; i < 6; i++) {
        frames.push(frame.clone().composite([
            { input: i < 3 ? back1 : back2 },
            { input: asBuffer(topCaption), left: i === 0 ? 10 : random.int(-25, 25), top: i === 0 ? 15 : random.int(0, 20) },
            { input: asBuffer(bottomCaption), left: 10, top: 228 }
        ]).toUint8Array());
    }

    const data = await context.renderGif(
        (await Promise.all(frames)).map(f => f.data),
        {
            width: 400,
            height: 300,
            repeat: 0,
            delay: 50,
            quality: 10
        });

    return { data, fileName: 'free.gif' };
}
