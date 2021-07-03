import Jimp from 'jimp';
import { BaseImageGenerator, Logger, mapping, TruthOptions } from '../core';

export class TruthGenerator extends BaseImageGenerator<'truth'> {
    public constructor(logger: Logger) {
        super('truth', logger, mapOptions);
    }

    public async executeCore({ text }: TruthOptions): Promise<Buffer> {
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

const mapOptions = mapping.object<TruthOptions>({
    text: mapping.string
});
