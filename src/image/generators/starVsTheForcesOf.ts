import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ImageResult, StarVsTheForcesOfOptions } from '@blargbot/image/types';
import sharp from 'sharp';

export class StarVsTheForcesOfGenerator extends BaseImageGenerator<'starVsTheForcesOf'> {
    public constructor(worker: ImageWorker) {
        super('starVsTheForcesOf', worker);
    }

    public async execute({ avatar }: StarVsTheForcesOfOptions): Promise<ImageResult> {
        const avatarImg = sharp(await this.getRemote(avatar)).resize(700, 700);
        const bgImg = sharp(await this.generate(await avatarImg.toBuffer(), x => {
            x.out('-matte').out('-virtual-pixel').out('transparent');
            x.out('-extent').out('1468x1656');
            x.out('-distort').out('Perspective').out('0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656');
        })).resize(734, 828)
            .extract({ left: 0, top: 104, width: 600, height: 540 });

        const foreground = sharp(this.getLocalResourcePath('starvstheforcesof.png'))
            .resize(960, 540)
            .linear(1, 0); // TODO: need latest version of sharp

        const result = sharp({ create: { width: 960, height: 540, channels: 4, background: 'transparent' } })
            .composite([
                { input: await bgImg.toBuffer(), left: 430, top: 0 },
                { input: await foreground.toBuffer(), left: 0, top: 0 }
            ]);

        return {
            data: await result.png().toBuffer(),
            fileName: 'starvstheforcesof.png'
        };
    }
}

// const blends: Record<sharp.Blend, 0> = {
//     add: 0,
//     clear: 0,
//     source: 0,
//     over: 0,
//     in: 0,
//     out: 0,
//     atop: 0,
//     dest: 0,
//     'dest-over': 0,
//     'dest-in': 0,
//     'dest-out': 0,
//     'dest-atop': 0,
//     xor: 0,
//     saturate: 0,
//     multiply: 0,
//     screen: 0,
//     overlay: 0,
//     darken: 0,
//     lighten: 0,
//     'color-dodge': 0,
//     'colour-dodge': 0,
//     'color-burn': 0,
//     'colour-burn': 0,
//     'hard-light': 0,
//     'soft-light': 0,
//     difference: 0,
//     exclusion: 0
// };
