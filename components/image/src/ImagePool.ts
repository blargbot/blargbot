import { ImageWorkerConfiguration } from '@blargbot/config';
import { WorkerPool } from '@blargbot/core/worker';
import { ImageGeneratorMap, ImageResult } from '@blargbot/image/types';
import { Logger } from '@blargbot/logger';

import { ImageConnection } from './ImageConnection';

export class ImagePool extends WorkerPool<ImageConnection> {
    readonly #clusterId: number;
    #nextWorker: number;

    public constructor(clusterId: number, config: ImageWorkerConfiguration, logger: Logger) {
        super({
            type: 'Image',
            workerCount: config.perCluster,
            defaultTimeout: config.spawnTime,
            logger
        });
        this.#nextWorker = 0;
        this.#clusterId = clusterId;
    }

    protected createWorker(id: number): ImageConnection {
        return new ImageConnection(id + this.#clusterId, this.logger);
    }

    public async render<T extends keyof ImageGeneratorMap>(command: T, data: ImageGeneratorMap[T]): Promise<ImageResult | undefined> {
        const workerId = this.#nextWorker;
        this.#nextWorker = (this.#nextWorker + 1) % this.workerCount; // round robin
        const worker = this.tryGet(workerId) ?? await this.spawn(workerId);
        return await worker.render(command, data);
    }
}
