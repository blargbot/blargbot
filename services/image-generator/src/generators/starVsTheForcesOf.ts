import type { StarVsTheForcesOfOptions } from '@blargbot/image-generator-client';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class StarVsTheForcesOfGenerator extends InProcessSharpGenerator<StarVsTheForcesOfOptions> {
    readonly #foreground = this.getLocalImage('starvstheforcesof-foreground.png');

    protected async generateSharp({ avatar }: StarVsTheForcesOfOptions): Promise<sharp.Sharp> {
        const avatarRaw = await this.getRemoteImage(avatar, a => a
            .resize(700, 700)
            .toBuffer());

        const avatarMagick = this.imageMagick(avatarRaw)
            .matte()
            .virtualPixel('transparent')
            .extent(1468, 1656)
            .out('-distort', 'Perspective', '0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656')
            .resize(734, 828)
            .crop(600, 540, 0, 104);

        const avatarStats = await sharp(avatarRaw).stats();
        const channels = avatarStats.channels.slice(0, 3).map(c => c.mean);
        const min = Math.min(...channels);
        const max = Math.max(...channels);
        const scale = channels.map(() => 1);
        const shift = channels.map(c => (c - min) * 32 / (max - min)); // bring all channels into range 0 - 32
        const foreground = sharp(this.#foreground.path)
            .resize(960, 540)
            .linear(scale.map(Math.round), shift.map(Math.round));

        return sharp({ create: { width: 960, height: 540, channels: 4, background: 'transparent' } })
            .composite([
                { input: await this.magickToBuffer(avatarMagick, 'png'), left: 430, top: 0 },
                { input: await foreground.toBuffer(), left: 0, top: 0 }
            ]);
    }
}
