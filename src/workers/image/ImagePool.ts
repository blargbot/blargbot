import { Logger } from '@core/Logger';
import { WorkerPool } from '@core/worker';
import { ImageGeneratorMap, ImageResult } from '@image/types';

import { ImageConnection } from './ImageConnection';

export class ImagePool extends WorkerPool<ImageConnection> {
    private nextWorker: number;

    public constructor(private readonly clusterId: number, workerCount: number, logger: Logger) {
        super('Image', workerCount, 20000, logger);
        this.nextWorker = 0;
    }

    protected createWorker(id: number): ImageConnection {
        return new ImageConnection(id + this.clusterId, this.logger);
    }

    public async render<T extends keyof ImageGeneratorMap>(command: T, data: ImageGeneratorMap[T]): Promise<ImageResult | undefined> {
        const worker = this.tryGet(this.nextWorker) ?? await this.spawn(this.nextWorker);
        this.nextWorker = (this.nextWorker + 1) % this.workerCount;
        return await worker.render(command, data);
    }
}
