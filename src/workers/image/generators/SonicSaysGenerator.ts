import { BaseImageGenerator, Logger, mapping, SonicSaysOptions } from '@image/core';

export class SonicSaysGenerator extends BaseImageGenerator<'sonicSays'> {
    public constructor(logger: Logger) {
        super('sonicSays', logger, mapOptions);
    }

    public async executeCore({ text }: SonicSaysOptions): Promise<Buffer> {
        return await this.renderPhantom('sonicsays.html', {
            scale: 2,
            replacements: { replace1: text }
        });
    }
}

const mapOptions = mapping.object<SonicSaysOptions>({
    text: mapping.string
});
