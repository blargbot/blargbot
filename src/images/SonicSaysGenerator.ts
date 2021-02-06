import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class SonicSaysGenerator extends BaseImageGenerator {
    constructor(logger: WorkerLogger) {
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
