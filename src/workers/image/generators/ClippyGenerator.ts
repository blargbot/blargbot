import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ClippyOptions, ImageResult } from '@image/types';
import Jimp from 'jimp';

export class ClippyGenerator extends BaseImageGenerator<'clippy'> {
    public constructor(logger: Logger) {
        super('clippy', logger, mapOptions);
    }

    public async executeCore({ text }: ClippyOptions): Promise<ImageResult> {
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

const mapOptions = mapping.mapObject<ClippyOptions>({
    text: mapping.mapString
});
