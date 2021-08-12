import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { CaptionOptions, ImageResult, ValidFont } from '@image/types';
import Jimp from 'jimp';

export class CaptionGenerator extends BaseImageGenerator<'caption'> {
    public constructor(logger: Logger) {
        super('caption', logger, mapOptions);
    }

    public async executeCore({ url, input, font }: CaptionOptions): Promise<ImageResult> {
        const img = await this.getRemoteJimp(url);
        img.scaleToFit(800, 800);

        const height = img.bitmap.height;
        const width = img.bitmap.width;
        if (input.top !== undefined) {
            const topcap = await this.renderJimpText(input.top, {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'north',
                fill: 'white',
                stroke: 'black',
                strokewidth: '16'
            });
            img.composite(topcap, 0, 0);
        }
        if (input.bottom !== undefined) {
            const botcap = await this.renderJimpText(input.bottom, {
                font,
                size: `${width}x${height / 6}`,
                gravity: 'south',
                fill: 'white',
                stroke: 'black',
                strokewidth: '16'
            });
            img.composite(botcap, 0, height / 6 * 5);
        }

        return {
            data: await img.getBufferAsync(Jimp.MIME_JPEG),
            fileName: 'caption.jpeg'
        };
    }
}

const supportedFonts = Object.keys<{ [P in ValidFont]: true }>({
    ['ARCENA.ttf']: true,
    ['AnnieUseYourTelescope.ttf']: true,
    ['IndieFlower.ttf']: true,
    ['Roboto-Regular.ttf']: true,
    ['SFToontime.ttf']: true,
    ['Ubuntu-Regular.ttf']: true,
    ['animeace.ttf']: true,
    ['arial.ttf']: true,
    ['comicjens.ttf']: true,
    ['comicsans.ttf']: true,
    ['delius.ttf']: true,
    ['impact.ttf']: true
});

const mapOptions = mapping.mapObject<CaptionOptions>({
    font: mapping.mapIn(...supportedFonts),
    url: mapping.mapString,
    input: mapping.mapObject({
        top: mapping.mapOptionalString,
        bottom: mapping.mapOptionalString
    })
});
