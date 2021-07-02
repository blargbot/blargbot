import Jimp from 'jimp';
import { BaseImageGenerator } from '../core';

export class ShitGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ plural, text }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string')
            return null;

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
