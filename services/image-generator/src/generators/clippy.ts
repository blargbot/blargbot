import type { ClippyOptions } from '@blargbot/image-types';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class ClippyGenerator extends InProcessSharpGenerator<ClippyOptions> {
    readonly #background = this.getLocalImage('clippy-background.png');

    protected async generateSharp({ text }: ClippyOptions): Promise<sharp.Sharp> {
        return sharp(this.#background.path)
            .composite([{
                input: await this.getText(text, {
                    format: 'png',
                    font: 'arial',
                    width: 290,
                    height: 130,
                    gravity: 'North'
                }),
                left: 28,
                top: 36
            }]);
    }
}
