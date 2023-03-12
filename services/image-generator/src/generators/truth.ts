import type { TruthOptions } from '@blargbot/image-generator-client';
import sharp from 'sharp';

import InProcessSharpGenerator from './base/InProcessSharpGenerator.js';

export default class TruthGenerator extends InProcessSharpGenerator<TruthOptions> {
    readonly #background = this.getLocalImage('truth-background.png');

    protected async generateSharp({ text }: TruthOptions): Promise<sharp.Sharp> {
        return sharp(this.#background.path)
            .composite([{
                input: await this.getText(text, {
                    format: 'png',
                    font: 'annieUseYourTelescope',
                    width: 96,
                    height: 114,
                    gravity: 'North'
                }),
                left: 95,
                top: 289
            }]);
    }
}
