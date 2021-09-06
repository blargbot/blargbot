import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ImageWorker } from '@image/ImageWorker';
import { ImageResult, TruthOptions } from '@image/types';
import Jimp from 'jimp';

export class TruthGenerator extends BaseImageGenerator<'truth'> {
    public constructor(worker: ImageWorker) {
        super('truth', worker);
    }

    public async execute({ text }: TruthOptions): Promise<ImageResult> {
        const caption = await this.renderJimpText(text, {
            font: 'AnnieUseYourTelescope.ttf',
            size: '96x114',
            gravity: 'North'
        });
        const img = await this.getLocalJimp('truth.png');
        img.composite(caption, 95, 289);

        return {
            data: await img.getBufferAsync(Jimp.MIME_PNG),
            fileName: 'truth.png'
        };
    }
}
