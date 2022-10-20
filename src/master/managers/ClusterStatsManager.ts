import { ApiConnection } from '@blargbot/api';
import { ClusterConnection } from '@blargbot/cluster';
import { ClusterStats } from '@blargbot/cluster/types';
import { WorkerPool } from '@blargbot/core/worker';

export class ClusterStatsManager {
    readonly #statsMap: WeakMap<ClusterConnection, ClusterStats>;
    readonly #activeClusters: Map<number, ClusterConnection>;
    readonly #apis: WorkerPool<ApiConnection>;

    public constructor(apis: WorkerPool<ApiConnection>) {
        this.#statsMap = new Map();
        this.#activeClusters = new Map();
        this.#apis = apis;
    }

    public set(cluster: ClusterConnection, stats: ClusterStats | undefined): void {
        if (stats === undefined)
            this.#statsMap.delete(cluster);
        else
            this.#statsMap.set(cluster, stats);

        const current = this.#activeClusters.get(cluster.id);
        if (current?.created.isAfter(cluster.created) === true)
            return;

        this.#activeClusters.set(cluster.id, cluster);
        this.#apis.forEach((_, api) => api?.send('clusterStats', this.getAll()));
    }

    public get(cluster: ClusterConnection): ClusterStats | undefined {
        return this.#statsMap.get(cluster);
    }

    public getAll(): Record<number, ClusterStats | undefined> {
        return Object.fromEntries(
            [...this.#activeClusters.values()].map(cluster => [cluster.id, this.get(cluster)] as const)
        );
    }
}
