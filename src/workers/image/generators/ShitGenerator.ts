import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ImageResult, ShitOptions } from '@image/types';
import Jimp from 'jimp';

export class ShitGenerator extends BaseImageGenerator<'shit'> {
    public constructor(logger: Logger) {
        super('shit', logger, mapOptions);
    }

    public async executeCore({ plural, text }: ShitOptions): Promise<ImageResult> {
        const caption = await this.renderJimpText(text, {
            font: 'animeace.ttf',
            size: '200x160',
            gravity: 'South'
        });
        const img = await this.getLocalJimp(`SHIT${plural ? 'S' : ''}.png`);
        img.composite(caption, 810, 31);

        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'shit.png'
        };
    }
}

const mapOptions = mapping.mapObject<ShitOptions>({
    plural: mapping.mapBoolean,
    text: mapping.mapString
});
