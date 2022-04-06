import { ApiConnection } from '@blargbot/api';
import { ClusterStats } from '@blargbot/cluster/types';
import { WorkerPool } from '@blargbot/core/worker';

export class ClusterStatsManager {
    private readonly statsMap: Record<number, ClusterStats | undefined>;

    public constructor(private readonly apis: WorkerPool<ApiConnection>) {
        this.statsMap = {};
    }

    public set(clusterId: number, stats: ClusterStats | undefined): void {
        if (stats === undefined)
            delete this.statsMap[clusterId];
        else
            this.statsMap[clusterId] = stats;
        this.apis.forEach((_, api) => api?.send('clusterStats', this.statsMap));
    }

    public get(clusterId: number): ClusterStats | undefined {
        return this.statsMap[clusterId];
    }

    public getAll(): Record<number, ClusterStats | undefined> {
        return this.statsMap;
    }
}
