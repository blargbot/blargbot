import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class ShitGenerator extends BaseImageGenerator {
    constructor(logger: WorkerLogger) {
        super(logger);
    }

    async execute({ plural, text }: JObject) {
        if (typeof text !== 'string')
            return;

        let caption = await this.renderJimpText(text, {
            font: 'animeace.ttf',
            size: '200x160',
            gravity: 'South'
        });
        let img = await this.getLocalJimp(`SHIT${plural ? 'S' : ''}.png`);
        img.composite(caption, 810, 31);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}
