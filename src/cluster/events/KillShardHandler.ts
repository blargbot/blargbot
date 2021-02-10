import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';

export class KillShardHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'killshard');
    }

    protected execute([data]: Parameters<ProcessMessageHandler>): void {
        this.cluster.logger.shardi('Killing shard', data, 'without a reconnect.');
        this.cluster.discord.shards.get(data)
            ?.disconnect({ reconnect: false });
    }

}