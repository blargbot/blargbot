import { ApiConnection } from '@api';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ApiGetClusterStatsHandler extends WorkerPoolEventService<ApiConnection, unknown, Record<number, ClusterStats | undefined>> {
    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getClusterStats',
            mapping.mapUnknown,
            ({ reply }) => reply(this.getStats())
        );
    }

    protected getStats(): Record<number, ClusterStats | undefined> {
        return this.master.clusterStats.getAll();
    }
}
