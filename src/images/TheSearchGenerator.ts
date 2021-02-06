import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class TheSearchGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return;

        let caption = await this.renderJimpText(text, {
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        });

        let img = await this.getLocalJimp(`thesearch.png`);
        img.composite(caption, 60, 331);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }


}
