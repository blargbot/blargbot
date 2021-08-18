import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { WorkerPoolEventHandler } from '@core/types';
import { Master } from '@master';

export class ClusterGetClusterStatsHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'getClusterStats');
    }

    protected execute(...[, , , reply]: Parameters<WorkerPoolEventHandler<ClusterConnection>>): void {
        return reply(this.master.clusterStats.getAll());
    }
}
