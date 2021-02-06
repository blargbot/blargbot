import { ImageModuleLoader } from '../../core/ImageModuleLoader';
import { BaseWorker } from '../../core/BaseWorker';

export class ImageWorker extends BaseWorker {
    public readonly renderers: ImageModuleLoader;
    constructor(logger: CatLogger) {
        super(logger)
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ImageModuleLoader('images', this.logger);
    }

    async handle(type: string, id: Snowflake, data: JToken) {
        switch (type) {
            case 'img':
                if (isImageData(data)) {
                    this.logger.worker(`${type} Requested`);
                    let buffer = await this.render(data.command, data);
                    this.logger.worker(`${type} finished, submitting as base64. Size: ${buffer?.length ?? 'NaN'}`);
                    this.send('img', id, buffer?.toString('base64'));
                }
        }
    }

    async render(command: string, message: JObject) {
        let generator = this.renderers.get(command);
        if (!generator)
            return null;

        try {
            return await generator.execute(message);
        } catch (err) {
            let message = err instanceof Error ? err.stack : err;
            this.logger.error(`An error occurred while generating ${command}: ${message}`);
            return null;
        }
    }

    async start() {
        await Promise.all([
            this.renderers.init()
        ])
        super.start();
    }
}

function isImageData(value: JToken): value is JObject & { command: string } {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && typeof value.command === 'string';
}