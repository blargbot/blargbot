import { BaseImageGenerator } from '@blargbot/image/BaseImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { ImageResult, TruthOptions } from '@blargbot/image/types';
import sharp from 'sharp';

export class TruthGenerator extends BaseImageGenerator<`truth`> {
    public constructor(worker: ImageWorker) {
        super(`truth`, worker);
    }

    public async execute({ text }: TruthOptions): Promise<ImageResult> {
        const result = sharp(this.getLocalPath(`truth.png`))
            .composite([{
                input: await this.renderText(text, {
                    font: `AnnieUseYourTelescope.ttf`,
                    width: 96,
                    height: 114,
                    gravity: `North`
                }),
                left: 95,
                top: 289
            }]);

        return {
            data: await result.png().toBuffer(),
            fileName: `truth.png`
        };
    }
}
