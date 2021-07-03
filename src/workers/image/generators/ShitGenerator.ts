import Jimp from 'jimp';
import { BaseImageGenerator, Logger, mapping, ShitOptions } from '../core';

export class ShitGenerator extends BaseImageGenerator<'shit'> {
    public constructor(logger: Logger) {
        super('shit', logger, mapOptions);
    }

    public async executeCore({ plural, text }: ShitOptions): Promise<Buffer | null> {
        const caption = await this.renderJimpText(text, {
            font: 'animeace.ttf',
            size: '200x160',
            gravity: 'South'
        });
        const img = await this.getLocalJimp(`SHIT${plural ? 'S' : ''}.png`);
        img.composite(caption, 810, 31);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}

const mapOptions = mapping.object<ShitOptions>({
    plural: mapping.boolean,
    text: mapping.string
});