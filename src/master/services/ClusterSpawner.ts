import { BaseService } from '../../structures/BaseService';
import { Master } from '../Master';

export class ClusterSpawner extends BaseService {
    public constructor(
        public readonly master: Master
    ) {
        super();
    }

    public start(): void {
        void this.master.clusters.spawnAll();
    }

    public stop(): void {
        this.master.clusters.killAll();
    }

}