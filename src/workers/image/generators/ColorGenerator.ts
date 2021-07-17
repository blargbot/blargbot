import Jimp from 'jimp';
import { BaseImageGenerator, ColorOptions, Logger, mapping } from '@image/core';

export class ColorGenerator extends BaseImageGenerator<'color'> {
    public constructor(logger: Logger) {
        super('color', logger, mapOptions);
    }

    public async executeCore({ hex }: ColorOptions): Promise<Buffer> {
        return await new Jimp(128, 128, hex)
            .getBufferAsync(Jimp.MIME_PNG);
    }
}

const mapOptions = mapping.object<ColorOptions>({
    hex: mapping.number
});
