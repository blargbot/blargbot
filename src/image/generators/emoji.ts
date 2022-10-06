import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { EmojiOptions, ImageResult } from '@blargbot/image/types';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';
import twemoji from 'twemoji';

// the .base property is undocumented in the types. Doing this allows us to use it, but detect if it is removed in the future.
const twemojiBase = (twemoji as { base?: string; }).base ?? `https://twemoji.maxcdn.com/v/14.0.2/`;

export class EmojiGenerator extends BaseImageGenerator<`emoji`> {
    public constructor(worker: ImageWorker) {
        super(`emoji`, worker);
    }

    public async execute({ name, svg, size }: EmojiOptions): Promise<ImageResult | undefined> {
        const codePoint = twemoji.convert.toCodePoint(name);

        let file = await fetch(path.join(twemojiBase, `svg/${codePoint}.svg`));
        if (file.status === 404) {
            if (codePoint.includes(`-fe0f`)) // remove variation selector-16 if present
                file = await fetch(path.join(twemojiBase, `svg/${codePoint.replaceAll(`-fe0f`, ``)}.svg`));
        }
        if (!file.status.toString().startsWith(`2`))
            return undefined;

        const body = await file.buffer();
        if (svg)
            return { fileName: `emoji.svg`, data: body };

        const buffer = await sharp(body)
            .resize(size, size)
            .png()
            .toBuffer();
        return { fileName: `emoji.png`, data: buffer };
    }
}
