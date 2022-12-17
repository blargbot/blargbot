import type { PixelateOptions } from '@blargbot/image-types';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class PixelateGenerator extends InProcessSharpGenerator<PixelateOptions> {
    protected async generateSharp({ url, scale }: PixelateOptions): Promise<sharp.Sharp> {
        const small = await this.getRemoteImage(url, a => a
            .resize(scale, scale, { fit: 'inside' })
            .toBuffer());

        return sharp(small)
            .resize(256, 256, { fit: 'outside', kernel: 'nearest' });
    }
}
