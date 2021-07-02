import Jimp from 'jimp';
import { BaseImageGenerator } from '../core';

export class CaptionGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ url, input, font }: JObject): Promise<Buffer | null> {
        if (typeof url !== 'string' || !checkInput(input) || typeof font !== 'string')
            return null;

        const img = await this.getRemoteJimp(url);
        img.scaleToFit(800, 800);

        const height = img.bitmap.height;
        const width = img.bitmap.width;
        if (input.t) {
            const topcap = await this.renderJimpText(input.t.join(' '), {
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
            const botcap = await this.renderJimpText(input.b.join(' '), {
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

function checkInput(source: JToken): source is { t?: JArray, b?: JArray } {
    if (typeof source !== 'object' || source === null || Array.isArray(source))
        return false;

    if ('t' in source && !Array.isArray(source.t))
        return false;

    if ('b' in source && !Array.isArray(source.b))
        return false;

    return true;
}