import { ClusterConnection } from '@blargbot/cluster';
import { ClusterStats } from '@blargbot/cluster/types';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ClusterGetClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, 'getClusterStats'> {
    readonly #master: Master;

    public constructor(master: Master) {
        super(master.clusters, 'getClusterStats', ({ reply }) => reply(this.getStats()));
        this.#master = master;
    }

    protected getStats(): Record<number, ClusterStats | undefined> {
        return this.#master.clusterStats.getAll();
    }
}
