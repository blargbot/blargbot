import { ApiConnection } from '@api';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ApiGetClusterStatsHandler extends WorkerPoolEventService<ApiConnection, 'getClusterStats'> {
    public constructor(private readonly master: Master) {
        super(master.api, 'getClusterStats', ({ reply }) => reply(this.getStats()));
    }

    protected getStats(): Record<number, ClusterStats | undefined> {
        return this.master.clusterStats.getAll();
    }
}
