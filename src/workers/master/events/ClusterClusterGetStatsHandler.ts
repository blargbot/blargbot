import { ClusterConnection } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ClusterGetClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, unknown, Record<number, ClusterStats | undefined>> {
    public constructor(private readonly master: Master) {
        super(
            master.clusters,
            'getClusterStats',
            mapping.mapUnknown,
            ({ reply }) => reply(this.getStats())
        );
    }

    protected getStats(): Record<number, ClusterStats | undefined> {
        return this.master.clusterStats.getAll();
    }
}
