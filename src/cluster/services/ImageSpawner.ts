import { Cluster } from '@blargbot/cluster';
import { BaseService } from '@blargbot/core/serviceTypes';

export class ImageSpawner extends BaseService {
    public readonly type = 'image';

    public constructor(
        public readonly cluster: Cluster
    ) {
        super();
    }

    public async start(): Promise<void> {
        await this.cluster.images.spawnAll();
        this.cluster.logger.info('All image workers are spawned!');
    }

    public async stop(): Promise<void> {
        await this.cluster.images.killAll();
    }
}
