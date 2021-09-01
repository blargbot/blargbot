import { Cluster } from '@cluster';
import { BaseService } from '@core/serviceTypes';

export class ImageSpawner extends BaseService {
    public readonly type = 'image';

    public constructor(
        public readonly cluster: Cluster
    ) {
        super();
    }

    public async start(): Promise<void> {
        await this.cluster.images.spawnAll();
        this.cluster.logger.info('All clusters are spawned!');
    }

    public stop(): void {
        this.cluster.images.killAll();
    }

}
