import type sharp from 'sharp';

import InProcessImageGenerator from './InProcessImageGenerator.js';

export default abstract class InProcessSharpGenerator<Options> extends InProcessImageGenerator<Options> {
    protected abstract generateSharp(options: Options): Promise<sharp.Sharp | Blob>;

    public override async generate(options: Options): Promise<Blob> {
        const result = await this.generateSharp(options);
        if (result instanceof Blob)
            return result;

        const { data, info } = await result.png().toBuffer({ resolveWithObject: true });
        return new Blob([data], { type: `image/${info.format}` });
    }
}
