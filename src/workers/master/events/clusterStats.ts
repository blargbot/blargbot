import { ClusterConnection, ClusterStats } from '../../cluster';
import { WorkerPoolEventService } from '@master/core';
import { Master } from '../Master';

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
