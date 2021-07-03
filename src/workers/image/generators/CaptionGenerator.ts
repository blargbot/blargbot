import Jimp from 'jimp';
import { BaseImageGenerator, CaptionOptions, Logger, mapping } from '../core';

export class CaptionGenerator extends BaseImageGenerator<'caption'> {
    public constructor(logger: Logger) {
        super('caption', logger, mapOptions);
    }

    public async executeCore({ url, input, font }: CaptionOptions): Promise<Buffer> {
        const img = await this.getRemoteJimp(url);
        img.scaleToFit(800, 800);

        const height = img.bitmap.height;
        const width = img.bitmap.width;
        if (input.t !== undefined) {
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
        if (input.b !== undefined) {
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

const mapOptions = mapping.object<CaptionOptions>({
    font: mapping.string,
    url: mapping.string,
    input: mapping.object({
        t: mapping.array<string, undefined>(mapping.string, { ifUndefined: mapping.result.undefined }),
        b: mapping.array<string, undefined>(mapping.string, { ifUndefined: mapping.result.undefined })
    })
});
