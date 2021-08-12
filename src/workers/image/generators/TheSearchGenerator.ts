import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ImageResult, TheSearchOptions } from '@image/types';
import Jimp from 'jimp';

export class TheSearchGenerator extends BaseImageGenerator<'theSearch'> {
    public constructor(logger: Logger) {
        super('theSearch', logger, mapOptions);
    }

    public async executeCore({ text }: TheSearchOptions): Promise<ImageResult> {
        const caption = await this.renderJimpText(text, {
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        });

        const img = await this.getLocalJimp('thesearch.png');
        img.composite(caption, 60, 331);

        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'thesearch.png'
        };
    }
}

const mapOptions = mapping.mapObject<TheSearchOptions>({
    text: mapping.mapString
});
