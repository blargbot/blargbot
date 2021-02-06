import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class ClydeGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return null;

        let originalText = await this.renderJimpText(text, {
            font: 'whitney.ttf',
            fontsize: 20,
            fill: '#ffffff',
            gravity: 'west'
        });
        let body = new Jimp(originalText.bitmap.width + 10, originalText.bitmap.height + 10);
        body.composite(originalText, 5, 5).autocrop().opacity(0.7);
        let height = 165 + body.bitmap.height;
        let canvas = new Jimp(864, height, 0x33363bff);
        let top = await this.getLocalJimp(`clydeTop.png`);
        let bottom = await this.getLocalJimp(`clydeBottom.png`);
        canvas.composite(top, 0, 0);
        canvas.composite(body, 118, 83);
        canvas.composite(bottom, 0, height - bottom.bitmap.height);

        return canvas.getBufferAsync(Jimp.MIME_PNG);
    }


}
