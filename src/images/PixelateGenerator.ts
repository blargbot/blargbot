import { BaseImageGenerator } from '../structures/BaseImageGenerator';
import Jimp from 'jimp';

export class PixelateGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ url, scale }: JObject): Promise<Buffer | null> {
        if (typeof url !== 'string' || typeof scale !== 'number')
            return null;

        const image = await this.getRemoteJimp(url);
        if (image.bitmap.width >= image.bitmap.height) {
            image.resize(scale, Jimp.AUTO);
            image.resize(256, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
        } else {
            image.resize(Jimp.AUTO, scale);
            image.resize(Jimp.AUTO, 256, Jimp.RESIZE_NEAREST_NEIGHBOR);
        }

        return await image.getBufferAsync(Jimp.MIME_PNG);
    }
}
