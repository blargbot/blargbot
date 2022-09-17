import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { CaptionOptions, ImageResult, TextOptions } from '@blargbot/image/types';
import sharp, { OverlayOptions } from 'sharp';

export class CaptionGenerator extends BaseImageGenerator<'caption'> {
    public constructor(worker: ImageWorker) {
        super('caption', worker);
    }

    public async execute({ url, input, font }: CaptionOptions): Promise<ImageResult> {
        const imgData = await sharp(await this.getRemote(url))
            .resize(800, 800, { fit: 'outside' })
            .toBuffer({ resolveWithObject: true });

        const width = imgData.info.width;
        const height = imgData.info.height / 6;
        const overlays: OverlayOptions[] = [];
        const textOptions: TextOptions = {
            font,
            width,
            height,
            fill: 'white',
            outline: ['black', 8]
        };

        if (input.top !== undefined) {
            overlays.push({
                input: await this.renderText(input.top, { ...textOptions, gravity: 'North' }),
                gravity: sharp.gravity.north
            });
        }
        if (input.bottom !== undefined) {
            overlays.push({
                input: await this.renderText(input.bottom, { ...textOptions, gravity: 'South' }),
                gravity: sharp.gravity.south
            });
        }

        return {
            data: await sharp(imgData.data).composite(overlays).png().toBuffer(),
            fileName: 'caption.png'
        };
    }
}
