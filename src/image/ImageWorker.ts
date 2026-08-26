import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Configuration } from '@blargbot/config';
import { ModuleLoader } from '@blargbot/core/modules/index.js';
import { BaseWorker } from '@blargbot/core/worker/index.js';
import type { ImageGeneratorMap, ImageIPCContract } from '@blargbot/image/types.js';
import type { Logger } from '@blargbot/logger';
import type $fetch from 'node-fetch';

import { BaseImageGenerator } from './BaseImageGenerator.js';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

export class ImageWorker extends BaseWorker<ImageIPCContract> {
    public readonly renderers: ModuleLoader<BaseImageGenerator<keyof ImageGeneratorMap>>;

    public constructor(public readonly config: Configuration, logger: Logger, public readonly fetch: typeof $fetch) {
        super(logger);
        this.logger.init(`IMAGE WORKER (pid ${this.id}) PROCESS INITIALIZED`);

        this.renderers = new ModuleLoader<BaseImageGenerator<keyof ImageGeneratorMap>>(`${thisDir}/generators`, BaseImageGenerator, [this], this.logger, g => [g.key]);
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.renderers.init()
        ]);
        await super.start();
    }
}
