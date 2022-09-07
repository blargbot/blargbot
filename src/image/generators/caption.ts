import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { CaptionOptions, ImageResult } from '@blargbot/image/types';
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
        if (input.top !== undefined) {
            overlays.push({
                input: await this.renderText(input.top, {
                    font,
                    size: `${width}x${height}`,
                    gravity: 'north',
                    fill: 'white',
                    stroke: 'black',
                    strokewidth: '16'
                }),
                left: 0,
                top: 0
            });
        }
        if (input.bottom !== undefined) {
            overlays.push({
                input: await this.renderText(input.bottom, {
                    font,
                    size: `${width}x${height}`,
                    gravity: 'south',
                    fill: 'white',
                    stroke: 'black',
                    strokewidth: '16'
                }),
                left: 0,
                top: Math.round(height * 5)
            });
        }

        return {
            data: await sharp(imgData.data).composite(overlays).png().toBuffer(),
            fileName: 'caption.png'
        };
    }
}
