import { WorkerPoolEventService } from '../../structures/WorkerPoolEventService';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { Master } from '../Master';
import { ClusterStats } from '../../workers/ClusterTypes';


export class ClusterStatsTracker extends WorkerPoolEventService<ClusterConnection> {
    private readonly stats: { [clusterId: number]: ClusterStats | undefined; };

    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'clusterStats');
        this.stats = {};
    }

    public clear(clusterId: number): void {
        this.stats[clusterId] = undefined;
    }

    public get(clusterId: number): ClusterStats | undefined {
        return this.stats[clusterId];
    }

    protected execute(worker: ClusterConnection, stats: ClusterStats): void {
        this.stats[worker.id] = stats;
    }
}
