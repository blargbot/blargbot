import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ClippyOptions, ImageResult } from '@blargbot/image/types';
import sharp from 'sharp';

export class ClippyGenerator extends BaseImageGenerator<'clippy'> {
    public constructor(worker: ImageWorker) {
        super('clippy', worker);
    }

    public async execute({ text }: ClippyOptions): Promise<ImageResult> {
        const result = sharp(this.getLocalPath('clippy.png'))
            .composite([{
                input: await this.renderText(text, {
                    font: 'arial.ttf',
                    width: 290,
                    height: 130,
                    gravity: 'North'
                }),
                left: 28,
                top: 36
            }]);

        return {
            data: await result.png().toBuffer(),
            fileName: 'clippy.png'
        };
    }
}
