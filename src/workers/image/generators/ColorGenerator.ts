import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ColorOptions, ImageResult } from '@image/types';
import Jimp from 'jimp';

export class ColorGenerator extends BaseImageGenerator<'color'> {
    public constructor(logger: Logger) {
        super('color', logger, mapOptions);
    }

    public async executeCore({ hex }: ColorOptions): Promise<ImageResult> {
        return {
            data: await new Jimp(128, 128, hex).getBufferAsync(Jimp.MIME_PNG),
            fileName: 'colour.png'
        };
    }
}

const mapOptions = mapping.mapObject<ColorOptions>({
    hex: mapping.mapNumber
});
