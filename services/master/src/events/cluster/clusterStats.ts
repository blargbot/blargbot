import type { ClusterConnection } from '@blargbot/cluster';
import type { ClusterStats } from '@blargbot/cluster/types.js';
import { metrics } from '@blargbot/core/Metrics.js';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/index.js';
import type { Master } from '@blargbot/master';

export class ClusterClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, 'clusterStats'> {
    public constructor(public readonly master: Master) {
        super(master.clusters, 'clusterStats', ({ worker, data }) => this.updateStats(worker, data));
    }

    protected updateStats(cluster: ClusterConnection, stats: ClusterStats): void {
        this.master.clusterStats.set(cluster, stats);
        metrics.shardStatus.reset();
        for (const shard of stats.shards) {
            metrics.shardStatus.labels(shard.status).inc();
        }
    }

    protected attach(worker: ClusterConnection): void {
        this.master.clusterStats.set(worker, undefined);
        super.attach(worker);
    }
}
