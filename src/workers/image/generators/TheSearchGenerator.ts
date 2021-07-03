import Jimp from 'jimp';
import { BaseImageGenerator, Logger, mapping, TheSearchOptions } from '../core';

export class TheSearchGenerator extends BaseImageGenerator<'theSearch'> {
    public constructor(logger: Logger) {
        super('theSearch', logger, mapOptions);
    }

    public async executeCore({ text }: TheSearchOptions): Promise<Buffer> {
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

const mapOptions = mapping.object<TheSearchOptions>({
    text: mapping.string
});
