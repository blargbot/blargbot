import Jimp from 'jimp';
import { BaseImageGenerator } from '../core';

export class ColorGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ hex }: JObject): Promise<Buffer | null> {
        if (typeof hex !== 'number')
            return null;

        return await new Jimp(128, 128, hex)
            .getBufferAsync(Jimp.MIME_PNG);
    }
}
