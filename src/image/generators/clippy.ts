import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ClippyOptions, ImageResult } from '@blargbot/image/types';
import Jimp from 'jimp';

export class ClippyGenerator extends BaseImageGenerator<'clippy'> {
    public constructor(worker: ImageWorker) {
        super('clippy', worker);
    }

    public async execute({ text }: ClippyOptions): Promise<ImageResult> {
        const caption = await this.renderJimpText(text, {
            font: 'arial.ttf',
            size: '290x130',
            gravity: 'North'
        });
        const img = await this.getLocalJimp('clippy.png');
        img.composite(caption, 28, 36);
        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'clippy.png'
        };
    }
}
