import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';

export class ClusterKillShardHandler extends ClusterEventService<'killshard'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'killshard', ({ data }) => this.killShard(data));
    }

    protected killShard(shardId: number): void {
        this.cluster.logger.cluster('Killing shard', shardId, 'without a reconnect.');
        const shard = this.cluster.discord.ws.shards.get(shardId);
        if (shard === undefined)
            return;

        this.cluster.discord.ws.shards.delete(shard.id);
        shard['destroy']({ closeCode: 4010 });
    }
}
