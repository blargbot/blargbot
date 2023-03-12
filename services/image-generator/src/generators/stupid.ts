import type { StupidOptions } from '@blargbot/image-generator-client';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class StupidGenerator extends InProcessSharpGenerator<StupidOptions> {
    readonly #background = this.getLocalImage('stupid-background.png');

    protected async generateSharp({ text, avatar }: StupidOptions): Promise<sharp.Sharp> {
        const overlays = [];
        if (avatar !== undefined) {
            const avatarImg = await this.getRemoteImage(avatar, e => e.ensureAlpha());
            const smallAvatar = avatarImg.clone().resize(74, 74);
            const bigAvatar = avatarImg.clone().resize(171, 171).rotate(18, { background: 'transparent' });
            overlays.push(
                { input: await smallAvatar.toBuffer(), left: 166, top: 131 },
                { input: await bigAvatar.toBuffer(), left: 277, top: 32 }
            );
        }

        return sharp(this.#background.path)
            .composite([
                ...overlays,
                {
                    input: await this.getText(text, {
                        format: 'png',
                        font: 'arcena',
                        fill: 'black',
                        outline: ['white', 2.5],
                        width: 272,
                        height: 60
                    }),
                    left: 268,
                    top: 0
                }
            ]);
    }
}
