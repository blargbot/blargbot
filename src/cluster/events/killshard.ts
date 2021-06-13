import { ClusterEventService } from '../../structures/ClusterEventService';
import { Cluster } from '../Cluster';

export class KillShardHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'killshard');
    }

    protected execute(shardId: number): void {
        this.cluster.logger.cluster('Killing shard', shardId, 'without a reconnect.');
        const shard = this.cluster.discord.shards.get(shardId);
        if (shard === undefined)
            return;
        shard.disconnect({ reconnect: false });
        this.cluster.discord.shards.remove(shard);
    }
}

