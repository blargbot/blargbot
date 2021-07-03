import Jimp from 'jimp';
import { BaseImageGenerator, ClippyOptions, Logger, mapping } from '../core';

export class ClippyGenerator extends BaseImageGenerator<'clippy'> {
    public constructor(logger: Logger) {
        super('clippy', logger, mapOptions);
    }

    public async executeCore({ text }: ClippyOptions): Promise<Buffer | null> {
        const caption = await this.renderJimpText(text, {
            font: 'arial.ttf',
            size: '290x130',
            gravity: 'North'
        });
        const img = await this.getLocalJimp('clippy.png');
        img.composite(caption, 28, 36);
        return img.getBufferAsync(Jimp.MIME_PNG);
    }
}

const mapOptions = mapping.object<ClippyOptions>({
    text: mapping.string
});