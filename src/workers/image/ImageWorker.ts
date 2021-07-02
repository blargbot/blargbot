import { ImageModuleLoader, BaseWorker, fafo } from './core';

export class ImageWorker extends BaseWorker {
    public readonly renderers: ImageModuleLoader;

    public constructor(logger: CatLogger) {
        super(logger);
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ImageModuleLoader(`${__dirname}/generators`, this.logger);

        this.on('img', fafo(async (data, _, reply) => {
            this.logger.worker(`${data.command} Requested`);
            const buffer = await this.render(data.command, data);
            this.logger.worker(`${data.command} finished, submitting as base64. Size: ${buffer?.length ?? 'NaN'}`);
            reply(buffer?.toString('base64') ?? null);
        }));
    }

    private async render(command: string, message: JObject): Promise<Buffer | null> {
        const generator = this.renderers.get(command);
        if (!generator)
            return null;

        try {
            return await generator.execute(message);
        } catch (err) {
            this.logger.error(`An error occurred while generating ${command}:`, err);
            return null;
        }
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.renderers.init()
        ]);
        super.start();
    }
}