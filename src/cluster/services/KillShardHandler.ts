import { ClusterEventService } from '../../structures/ClusterEventService';
import { Cluster } from '../Cluster';

export class KillShardHandler extends ClusterEventService<'killshard'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'killshard');
    }

    protected execute(id: number): void {
        this.cluster.logger.shardi('Killing shard', id, 'without a reconnect.');
        this.cluster.discord.shards
            .get(id)
            ?.disconnect({ reconnect: false });
    }

}