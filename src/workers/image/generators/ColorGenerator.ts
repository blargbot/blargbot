import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ColorOptions } from '@image/types';
import Jimp from 'jimp';

export class ColorGenerator extends BaseImageGenerator<'color'> {
    public constructor(logger: Logger) {
        super('color', logger, mapOptions);
    }

    public async executeCore({ hex }: ColorOptions): Promise<Buffer> {
        return await new Jimp(128, 128, hex)
            .getBufferAsync(Jimp.MIME_PNG);
    }
}

const mapOptions = mapping.mapObject<ColorOptions>({
    hex: mapping.mapNumber
});
