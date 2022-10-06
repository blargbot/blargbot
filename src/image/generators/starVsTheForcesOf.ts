import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ImageResult, StarVsTheForcesOfOptions } from '@blargbot/image/types';
import sharp from 'sharp';

export class StarVsTheForcesOfGenerator extends BaseImageGenerator<`starVsTheForcesOf`> {
    public constructor(worker: ImageWorker) {
        super(`starVsTheForcesOf`, worker);
    }

    public async execute({ avatar }: StarVsTheForcesOfOptions): Promise<ImageResult> {
        const avatarImg = sharp(await this.getRemote(avatar)).resize(700, 700);

        const bgImg = await this.gmConvert(await avatarImg.toBuffer(), x => x
            .matte()
            .virtualPixel(`transparent`)
            .extent(1468, 1656)
            .out(`-distort`, `Perspective`, `0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656`)
            .resize(734, 828)
            .crop(600, 540, 0, 104)
        );

        const stats = await avatarImg.stats();
        const channels = stats.channels.slice(0, 3).map(c => c.mean);
        const min = Math.min(...channels);
        const max = Math.max(...channels);
        const scale = channels.map(() => 1);
        const shift = channels.map(c => (c - min) * 32 / (max - min)); // bring all channels into range 0 - 32
        const foreground = sharp(this.getLocalPath(`starvstheforcesof.png`))
            .resize(960, 540)
            .linear(scale.map(Math.round), shift.map(Math.round));

        const result = sharp({ create: { width: 960, height: 540, channels: 4, background: `transparent` } })
            .composite([
                { input: bgImg, left: 430, top: 0 },
                { input: await foreground.toBuffer(), left: 0, top: 0 }
            ]);

        return {
            data: await result.png().toBuffer(),
            fileName: `starvstheforcesof.png`
        };
    }
}
