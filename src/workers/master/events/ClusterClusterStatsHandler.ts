import { ClusterConnection } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ClusterClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, 'clusterStats'> {
    public constructor(public readonly master: Master) {
        super(master.clusters, 'clusterStats', ({ worker, data }) => this.updateStats(worker.id, data));
    }

    protected updateStats(workerId: number, stats: ClusterStats): void {
        this.master.clusterStats.set(workerId, stats);
    }
}
