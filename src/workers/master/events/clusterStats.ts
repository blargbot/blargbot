import { ClusterConnection } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ClusterStatsHandler extends WorkerPoolEventService<ClusterConnection> {
    private readonly stats: { [clusterId: number]: ClusterStats | undefined; };

    public constructor(public readonly master: Master) {
        super(master.clusters, 'clusterStats');
        this.stats = {};
    }

    public clear(clusterId: number): void {
        this.stats[clusterId] = undefined;
    }

    public get(clusterId: number): ClusterStats | undefined {
        return this.stats[clusterId];
    }

    protected execute(worker: ClusterConnection, stats: ClusterStats): void {
        this.stats[worker.id] = stats;
    }
}
