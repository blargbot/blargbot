import { BaseService } from '../../structures/BaseService';
import { Master } from '../Master';

export class ClusterSpawner extends BaseService {
    public readonly type = 'cluster';

    public constructor(
        public readonly master: Master
    ) {
        super();
    }

    public async start(): Promise<void> {
        await this.master.clusters.spawnAll();
        this.master.logger.info('All clusters are spawned!');
    }

    public stop(): void {
        this.master.clusters.killAll();
    }

}