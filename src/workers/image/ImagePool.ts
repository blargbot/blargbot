import { ImageWorkerConfiguration } from '@core/Configuration';
import { Logger } from '@core/Logger';
import { WorkerPool } from '@core/worker';
import { ImageGeneratorMap, ImageResult } from '@image/types';

import { ImageConnection } from './ImageConnection';

export class ImagePool extends WorkerPool<ImageConnection> {
    private nextWorker: number;

    public constructor(private readonly clusterId: number, config: ImageWorkerConfiguration, logger: Logger) {
        super('Image', config.perCluster, config.spawnTime, logger);
        this.nextWorker = 0;
    }

    protected createWorker(id: number): ImageConnection {
        return new ImageConnection(id + this.clusterId, this.logger);
    }

    public async render<T extends keyof ImageGeneratorMap>(command: T, data: ImageGeneratorMap[T]): Promise<ImageResult | undefined> {
        const workerId = this.nextWorker;
        this.nextWorker = (this.nextWorker + 1) % this.workerCount; // round robin
        const worker = this.tryGet(workerId) ?? await this.spawn(workerId);
        return await worker.render(command, data);
    }
}
