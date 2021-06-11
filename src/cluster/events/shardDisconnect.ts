import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';

export class ShardDisconnectEventHandler extends DiscordEventService {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardDisconnect', cluster.logger);
    }

    public execute(error: Error | undefined, shardId: number): void {
        this.logger.cluster('shard', shardId, 'has disconnected', error);

        if (error === undefined)
            return;

        setTimeout(() => {
            const shard = this.discord.shards.get(shardId);
            if (shard === undefined)
                return;

            if (!shard.connecting && !shard.ready)
                shard.connect();
        }, 5000);
    }
}

