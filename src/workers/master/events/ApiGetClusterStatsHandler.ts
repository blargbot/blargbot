import { ApiConnection } from '@api';
import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { WorkerPoolEventHandler } from '@core/types';
import { Master } from '@master';

export class ApiGetClusterStatsHandler extends WorkerPoolEventService<ApiConnection> {
    public constructor(private readonly master: Master) {
        super(master.api, 'getClusterStats');
    }

    protected execute(...[, , , reply]: Parameters<WorkerPoolEventHandler<ClusterConnection>>): void {
        return reply(this.master.clusterStats.getAll());
    }
}
