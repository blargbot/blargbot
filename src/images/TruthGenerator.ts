import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class TruthGenerator extends BaseImageGenerator {
    constructor(logger: WorkerLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return;

        let caption = await this.renderJimpText(text, {
            font: 'AnnieUseYourTelescope.ttf',
            size: '96x114',
            gravity: 'North'
        });
        let img = await this.getLocalJimp(`truth.png`);
        img.composite(caption, 95, 289);

        return await img.getBufferAsync(Jimp.MIME_PNG);
    }
}
