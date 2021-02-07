import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator';

export class TruthGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ text }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string')
            return null;

        const caption = await this.renderJimpText(text, {
            font: 'AnnieUseYourTelescope.ttf',
            size: '96x114',
            gravity: 'North'
        });
        const img = await this.getLocalJimp('truth.png');
        img.composite(caption, 95, 289);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}
