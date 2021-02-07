import { BaseImageGenerator } from '../structures/BaseImageGenerator';

export class SonicSaysGenerator extends BaseImageGenerator {
    public constructor(logger: CatLogger) {
        super(logger);
    }

    public async execute({ text }: JObject): Promise<Buffer | null> {
        if (typeof text !== 'string')
            return null;

        return await this.renderPhantom('sonicsays.html', {
            scale: 2,
            replacements: { replace1: text }
        });
    }
}
