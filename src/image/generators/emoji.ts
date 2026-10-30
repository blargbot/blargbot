import path from 'node:path';

import type { ImageRequestData, ImageResponse } from '@blargbot/contracts';
import sharp from 'sharp';
import twemoji from 'twemoji';

import type { GeneratorContext } from '../GeneratorContext.js';

// the .base property is undocumented in the types. Doing this allows us to use it, but detect if it is removed in the future.
const twemojiBase = (twemoji as { base?: string; }).base ?? 'https://twemoji.maxcdn.com/v/14.0.2/';

export async function emoji(request: ImageRequestData<'emoji'>, context: GeneratorContext): Promise<ImageResponse> {
    const codePoint = twemoji.convert.toCodePoint(request.name);

    let file = await context.fetch(path.join(twemojiBase, `svg/${codePoint}.svg`));
    if (file.status === 404) {
        if (codePoint.includes('-fe0f')) // remove variation selector-16 if present
            file = await context.fetch(path.join(twemojiBase, `svg/${codePoint.replaceAll('-fe0f', '')}.svg`));
    }
    if (!file.status.toString().startsWith('2'))
        return null;

    const body = await file.bytes();
    if (request.svg)
        return { fileName: 'emoji.svg', data: body };

    const { data } = await sharp(body)
        .resize(request.size, request.size)
        .png()
        .toUint8Array();
    return { data, fileName: 'emoji.png' };
}
