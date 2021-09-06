import { ClusterConnection } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ClusterGetClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, 'getClusterStats'> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'getClusterStats', ({ reply }) => reply(this.getStats()));
    }

    protected getStats(): Record<number, ClusterStats | undefined> {
        return this.master.clusterStats.getAll();
    }
}
