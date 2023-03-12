import type { CaptionOptions } from '@blargbot/image-generator-client';
import type { OverlayOptions } from 'sharp';
import sharp from 'sharp';

import type { TextOptions } from './base/InProcessImageGenerator.js';
import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class CaptionGenerator extends InProcessSharpGenerator<CaptionOptions> {

    protected async generateSharp({ url, top, bottom, font }: CaptionOptions): Promise<sharp.Sharp> {
        const { info, data: bgImage } = await this.getRemoteImage(url, a => a
            .resize(800, 800, { fit: 'outside' })
            .toBuffer({ resolveWithObject: true }));

        const overlays: OverlayOptions[] = [];
        const textOptions: TextOptions = {
            format: 'png',
            font,
            width: info.width,
            height: info.height / 6,
            fill: 'white',
            outline: ['black', 8]
        };

        if (top !== undefined) {
            overlays.push({
                input: await this.getText(top, { ...textOptions, gravity: 'North' }),
                gravity: sharp.gravity.north
            });
        }
        if (bottom !== undefined) {
            overlays.push({
                input: await this.getText(bottom, { ...textOptions, gravity: 'South' }),
                gravity: sharp.gravity.south
            });
        }

        return sharp(bgImage)
            .composite(overlays);
    }
}
