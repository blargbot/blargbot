import path from 'node:path';

import type { EmojiOptions } from '@blargbot/image-generator-client';
import sharp from 'sharp';
import twemoji from 'twemoji';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class EmojiGenerator extends InProcessSharpGenerator<EmojiOptions> {
    // the .base property is undocumented in the types. Doing this allows us to use it, but detect if it is removed in the future.
    readonly #twemojiBase = 'base' in twemoji && typeof twemoji.base === 'string' ? twemoji.base : 'https://twemoji.maxcdn.com/v/14.0.2/';

    protected async generateSharp({ name, svg, size }: EmojiOptions): Promise<sharp.Sharp | Blob> {
        const codePoint = twemoji.convert.toCodePoint(name);
        const file = await this.#getEmojiSvg(name, codePoint);
        if (svg)
            return file;

        const buffer = Buffer.from(await file.arrayBuffer());
        return sharp(buffer)
            .resize(size, size)
            .png();
    }

    async #getEmojiSvg(name: string, codePoint: string): Promise<Blob> {
        const attempts = [codePoint];
        if (codePoint.includes('-fe0f')) // remove variation selector-16 if present
            attempts.push(codePoint.replaceAll('-fe0f', ''));

        for (const attempt of attempts) {
            try {
                return await this.getRemote(path.join(this.#twemojiBase, `svg/${attempt}.svg`), /^image\/svg\+xml$/);
            } catch { /* NO-OP */ }
        }

        throw new Error(`Failed to get emoji SVG for ${name} (${codePoint} - [${[...name].map(c => `0x${c.codePointAt(0)?.toString(16) ?? 'NULL'}`).join(', ')}])`);
    }
}
