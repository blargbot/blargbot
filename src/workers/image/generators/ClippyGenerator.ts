import Jimp from 'jimp';
import { BaseImageGenerator } from '../core';

export class ClippyGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ text }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string')
            return null;

        const caption = await this.renderJimpText(text, {
            font: 'arial.ttf',
            size: '290x130',
            gravity: 'North'
        });
        const img = await this.getLocalJimp('clippy.png');
        img.composite(caption, 28, 36);
        return img.getBufferAsync(Jimp.MIME_PNG);
    }
}
