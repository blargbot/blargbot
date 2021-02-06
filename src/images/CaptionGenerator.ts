import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class CaptionGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ url, input, font }: JObject) {
        if (typeof url !== 'string' || !checkInput(input) || typeof font !== 'string')
            return;

        let img = await this.getRemoteJimp(url);
        img.scaleToFit(800, 800);

        let height = img.bitmap.height;
        let width = img.bitmap.width;
        if (input.t) {
            let topcap = await this.renderJimpText(input.t.join(' '), {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'north',
                fill: 'white',
                stroke: 'black',
                strokewidth: '16'
            });
            img.composite(topcap, 0, 0);
        }
        if (input.b) {
            let botcap = await this.renderJimpText(input.b.join(' '), {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'south',
                fill: 'white',
                stroke: 'black',
                strokewidth: '16'
            });
            img.composite(botcap, 0, height / 6 * 5);
        }

        return await img.getBufferAsync(Jimp.MIME_JPEG);
    }
}

function checkInput(source: JToken): source is { t?: any[], b?: any[] } {
    if (typeof source !== 'object' || source === null || Array.isArray(source))
        return false;

    if ('t' in source && !Array.isArray(source.t))
        return false;

    if ('b' in source && !Array.isArray(source.b))
        return false;

    return true;
}