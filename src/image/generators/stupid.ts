import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ImageResult, StupidOptions } from '@blargbot/image/types';
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

        const result = sharp(this.getLocalResourcePath('stupid.png'))
            .composite([
                ...overlays,
                {
                    input: await this.renderText(text, {
                        font: 'ARCENA.ttf',
                        fill: 'black',
                        stroke: 'white',
                        strokewidth: '5',
                        size: '272x60'
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
