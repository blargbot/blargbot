import { ClusterConnection } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ClusterClusterStatsHandler extends WorkerPoolEventService<ClusterConnection, ClusterStats> {
    public constructor(public readonly master: Master) {
        super(
            master.clusters,
            'clusterStats',
            mapping.mapObject({
                channels: mapping.mapNumber,
                guilds: mapping.mapNumber,
                id: mapping.mapNumber,
                readyTime: mapping.mapNumber,
                rss: mapping.mapNumber,
                shardCount: mapping.mapNumber,
                shards: mapping.mapArray(mapping.mapObject({
                    id: mapping.mapNumber,
                    status: mapping.mapIn('READY', 'CONNECTING', 'RECONNECTING', 'IDLE', 'NEARLY', 'DISCONNECTED'),
                    latency: mapping.mapNumber,
                    guilds: mapping.mapNumber,
                    cluster: mapping.mapNumber,
                    time: mapping.mapNumber
                })),
                systemCpu: mapping.mapNumber,
                time: mapping.mapNumber,
                userCpu: mapping.mapNumber,
                users: mapping.mapNumber
            }),
            ({ worker, data }) => this.updateStats(worker.id, data)
        );
    }

    protected updateStats(workerId: number, stats: ClusterStats): void {
        this.master.clusterStats.set(workerId, stats);
    }
}
