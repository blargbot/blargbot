import { ClusterConnection } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ClusterStatsHandler extends WorkerPoolEventService<ClusterConnection> {

    public constructor(public readonly master: Master) {
        super(master.clusters, 'clusterStats');
    }

    protected execute(worker: ClusterConnection, stats: ClusterStats): void {
        this.master.clusterStats.set(worker.id, stats);
    }
}
