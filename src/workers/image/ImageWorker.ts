import { ImageModuleLoader, BaseWorker, fafo, Logger, mapping, ImageGeneratorMap, ImageRequest } from './core';

export class ImageWorker extends BaseWorker {
    public readonly renderers: ImageModuleLoader;

    public constructor(logger: Logger) {
        super(logger);
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ImageModuleLoader(`${__dirname}/generators`, this.logger);

        this.on('img', fafo(async (data, _, reply) => {
            const request = mapData(data);
            if (!request.valid) {
                reply(null);
                return;
            }

            this.logger.worker(`${request.value.command} Requested`);
            const buffer = await this.render(request.value.command, request.value.data);
            this.logger.worker(`${request.value.command} finished, submitting as base64. Size: ${buffer?.length ?? 'NaN'}`);
            reply(buffer?.toString('base64') ?? null);
        }));
    }

    private async render(command: keyof ImageGeneratorMap, message: unknown): Promise<Buffer | null> {
        const generator = this.renderers.get(command);
        if (generator === undefined)
            return null;

        try {
            return await generator.execute(message);
        } catch (err: unknown) {
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

const commands = Object.keys<{ [P in keyof ImageGeneratorMap]: undefined }>({
    art: undefined,
    cah: undefined,
    caption: undefined,
    clint: undefined,
    clippy: undefined,
    clyde: undefined,
    color: undefined,
    delete: undefined,
    distort: undefined,
    free: undefined,
    pcCheck: undefined,
    pixelate: undefined,
    retarded: undefined,
    shit: undefined,
    sonicSays: undefined,
    starVsTheForcesOf: undefined,
    theSearch: undefined,
    triggered: undefined,
    truth: undefined
});

const mapData = mapping.object<ImageRequest<keyof ImageGeneratorMap, unknown>>({
    command: mapping.in(...commands),
    data: mapping.unknown
});