import type { Configuration } from '@blargbot/config';
import { ModuleLoader } from '@blargbot/core/modules/index.js';
import { BaseWorker } from '@blargbot/core/worker/index.js';
import type { ImageGeneratorMap, ImageIPCContract } from '@blargbot/image/types.js';
import type { Logger } from '@blargbot/logger';

import { BaseImageGenerator } from './BaseImageGenerator.js';

export class ImageWorker extends BaseWorker<ImageIPCContract> {
    public readonly renderers: ModuleLoader<BaseImageGenerator<keyof ImageGeneratorMap>>;

    public constructor(public readonly config: Configuration, logger: Logger, public readonly fetch: typeof globalThis.fetch) {
        super(logger);
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ModuleLoader<BaseImageGenerator<keyof ImageGeneratorMap>>(`${import.meta.dirname}/generators`, BaseImageGenerator, [this], this.logger, g => [g.key]);
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.renderers.init()
        ]);
        await super.start();
    }
}
