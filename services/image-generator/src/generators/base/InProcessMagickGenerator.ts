import type gm from 'gm';

import InProcessImageGenerator from './InProcessImageGenerator.js';

export default abstract class InProcessMagickGenerator<Options> extends InProcessImageGenerator<Options> {
    protected abstract getImageFormat(options: Options): Awaitable<string>;
    protected abstract generateMagick(options: Options): Promise<gm.State | Blob>;

    public override async generate(options: Options): Promise<Blob> {
        const result = await this.generateMagick(options);
        if (result instanceof Blob)
            return result;

        const format = await this.getImageFormat(options);
        const data = await this.magickToBuffer(result, format);
        return new Blob([data], { type: `image/${format}` });
    }
}
