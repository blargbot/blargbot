import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { SonicSaysOptions } from '@image/types';

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

const mapOptions = mapping.mapObject<SonicSaysOptions>({
    text: mapping.mapString
});
