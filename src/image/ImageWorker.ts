import { Configuration } from '@core/Configuration';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { BaseWorker } from '@core/worker';
import { ImageGeneratorMap, ImageIPCContract } from '@image/types';

import { BaseImageGenerator } from './BaseImageGenerator';

export class ImageWorker extends BaseWorker<ImageIPCContract> {
    public readonly renderers: ModuleLoader<BaseImageGenerator<keyof ImageGeneratorMap>>;

    public constructor(process: NodeJS.Process, public readonly config: Configuration, logger: Logger) {
        super(process, logger);
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ModuleLoader<BaseImageGenerator<keyof ImageGeneratorMap>>(`${__dirname}/generators`, BaseImageGenerator, [this], this.logger, g => [g.key]);
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.renderers.init()
        ]);
        super.start();
    }
}
