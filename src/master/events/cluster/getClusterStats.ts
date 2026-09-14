import type { ClusterConnection, ClusterStats } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core';
import type { Master } from '@blargbot/master';

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
