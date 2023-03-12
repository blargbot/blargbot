import type { ArtOptions } from '@blargbot/image-generator-client';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class ArtGenerator extends InProcessSharpGenerator<ArtOptions> {
    readonly #foreground = this.getLocalImage('art-foreground.png');

    protected async generateSharp(options: ArtOptions): Promise<sharp.Sharp> {
        const avatar = await this.getRemoteImage(options.avatar, a => a
            .resize(370, 370)
            .toBuffer());

        return sharp({ create: { width: 1364, height: 1534, channels: 4, background: 'transparent' } })
            .composite([
                { input: avatar, left: 903, top: 92 },
                { input: avatar, left: 903, top: 860 },
                { input: this.#foreground.path }
            ]);
    }
}
