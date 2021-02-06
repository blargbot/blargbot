import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class ClippyGenerator extends BaseImageGenerator {
    constructor(logger: WorkerLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return;

        let caption = await this.renderJimpText(text, {
            font: 'arial.ttf',
            size: '290x130',
            gravity: 'North'
        });
        let img = await this.getLocalJimp(`clippy.png`);
        img.composite(caption, 28, 36);
        return img.getBufferAsync(Jimp.MIME_PNG)
    }
}
