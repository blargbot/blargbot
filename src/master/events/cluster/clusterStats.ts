import { ClusterConnection } from '@blargbot/cluster';
import { ClusterStats } from '@blargbot/cluster/types';
import { metrics } from '@blargbot/core/Metrics';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ClusterClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, 'clusterStats'> {
    public constructor(public readonly master: Master) {
        super(master.clusters, 'clusterStats', ({ worker, data }) => this.updateStats(worker.id, data));
    }

    protected updateStats(workerId: number, stats: ClusterStats): void {
        this.master.clusterStats.set(workerId, stats);
        metrics.shardStatus.reset();
        for (const shard of stats.shards) {
            metrics.shardStatus.labels(shard.status).inc();
        }
    }
}
