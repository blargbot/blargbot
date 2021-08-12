import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { fafo, mapping } from '@core/utils';
import { BaseWorker } from '@core/worker';
import { ImageGeneratorMap, ImageRequest, ImageResult } from '@image/types';

import { BaseImageGenerator } from './BaseImageGenerator';

export class ImageWorker extends BaseWorker {
    public readonly renderers: ModuleLoader<BaseImageGenerator>;

    public constructor(logger: Logger) {
        super(logger);
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ModuleLoader<BaseImageGenerator>(`${__dirname}/generators`, BaseImageGenerator, [this.logger], this.logger, g => [g.key]);

        this.on('img', fafo(async (data, _, reply) => {
            const request = mapData(data);
            if (!request.valid) {
                reply(null);
                return;
            }

            this.logger.worker(`${request.value.command} Requested`);
            const result = await this.render(request.value.command, request.value.data);
            this.logger.worker(`${request.value.command} finished, submitting as base64. Size: ${result?.data.length ?? 'NaN'}`);
            reply(result === undefined ? null : <ImageResult<string>>{
                data: result.data.toString('base64'),
                fileName: result.fileName
            });
        }));
    }

    private async render(command: keyof ImageGeneratorMap, message: JToken): Promise<ImageResult | undefined> {
        const generator = this.renderers.get(command);
        if (generator === undefined)
            return undefined;

        try {
            return await generator.execute(message);
        } catch (err: unknown) {
            this.logger.error(`An error occurred while generating ${command}:`, err);
            return undefined;
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

const mapData = mapping.mapObject<ImageRequest<keyof ImageGeneratorMap, JToken>>({
    command: mapping.mapIn(...commands),
    data: mapping.mapJToken
});
