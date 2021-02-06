import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class ColorGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ hex }: JObject) {
        if (typeof hex !== 'number')
            return;

        return await new Jimp(128, 128, hex)
            .getBufferAsync(Jimp.MIME_PNG);
    }
};
