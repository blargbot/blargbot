import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class ShardDisconnectHandler extends DiscordEventService<'shardDisconnect'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardDisconnect', cluster.logger);
    }

    public execute(error: Error, shardId: number): void {
        this.logger.cluster('shard', shardId, 'has disconnected', error);

        setTimeout(() => {
            const shard = this.discord.shards.get(shardId);
            if (shard === undefined)
                return;

            if (!shard.connecting && !shard.ready)
                shard.connect();
        }, 5000);
    }
}
