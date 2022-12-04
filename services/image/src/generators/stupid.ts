import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator.js';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { ImageResult, StupidOptions } from '@blargbot/image/types.js';
import sharp from 'sharp';

export class StupidGenerator extends BaseImageGenerator<'stupid'> {
    public constructor(worker: ImageWorker) {
        super('stupid', worker);
    }

    public async execute({ text, avatar }: StupidOptions): Promise<ImageResult> {
        const overlays = [];
        if (avatar !== undefined) {
            const avatarImg = sharp(await this.getRemote(avatar)).ensureAlpha();
            const smallAvatar = avatarImg.clone().resize(74, 74);
            const bigAvatar = avatarImg.clone().resize(171, 171).rotate(18, { background: 'transparent' });
            overlays.push(
                { input: await smallAvatar.toBuffer(), left: 166, top: 131 },
                { input: await bigAvatar.toBuffer(), left: 277, top: 32 }
            );
        }

        const result = sharp(this.getLocalImg('stupid.png').location)
            .composite([
                ...overlays,
                {
                    input: await this.renderText(text, {
                        font: 'ARCENA.ttf',
                        fill: 'black',
                        outline: ['white', 2.5],
                        width: 272,
                        height: 60
                    }),
                    left: 268,
                    top: 0
                }
            ]);

        return {
            data: await result.png().toBuffer(),
            fileName: 'stupid.png'
        };
    }
}
