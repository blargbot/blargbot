import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator';

export class TheSearchGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ text }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string')
            return null;

        const caption = await this.renderJimpText(text, {
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        });

        const img = await this.getLocalJimp('thesearch.png');
        img.composite(caption, 60, 331);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }


}
