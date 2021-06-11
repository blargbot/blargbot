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
        this.cluster.discord.shards.get(shardId)?.disconnect({ reconnect: false });
    }
}