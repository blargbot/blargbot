import { ApiConnection } from '@blargbot/api';
import { ClusterStats } from '@blargbot/cluster/types';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ApiGetClusterStatsHandler extends WorkerPoolEventService<ApiConnection, 'getClusterStats'> {
    public constructor(private readonly master: Master) {
        super(master.api, 'getClusterStats', ({ reply }) => reply(this.getStats()));
    }

    protected getStats(): Record<number, ClusterStats | undefined> {
        return this.master.clusterStats.getAll();
    }
}
