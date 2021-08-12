import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ClydeOptions, ImageResult } from '@image/types';
import Jimp from 'jimp';

export class ClydeGenerator extends BaseImageGenerator<'clyde'> {
    public constructor(logger: Logger) {
        super('clyde', logger, mapOptions);
    }

    public async executeCore({ text }: ClydeOptions): Promise<ImageResult> {
        const originalText = await this.renderJimpText(text, {
            font: 'whitney.ttf',
            fontsize: 20,
            fill: '#ffffff',
            gravity: 'west'
        });
        const body = new Jimp(originalText.bitmap.width + 10, originalText.bitmap.height + 10);
        body.composite(originalText, 5, 5).autocrop().opacity(0.7);
        const height = 165 + body.bitmap.height;
        const canvas = new Jimp(864, height, 0x33363bff);
        const top = await this.getLocalJimp('clydeTop.png');
        const bottom = await this.getLocalJimp('clydeBottom.png');
        canvas.composite(top, 0, 0);
        canvas.composite(body, 118, 83);
        canvas.composite(bottom, 0, height - bottom.bitmap.height);

        return {
            data: await canvas.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'clyde.png'
        };
    }

}

const mapOptions = mapping.mapObject<ClydeOptions>({
    text: mapping.mapString
});
