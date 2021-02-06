import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class SonicSaysGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return;

        return await this.renderPhantom('sonicsays.html', {
            scale: 2,
            replacements: { replace1: text }
        });
    }
}
