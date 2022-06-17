import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordShardReadyHandler extends DiscordEventService<'shardReady'> {
    public constructor(private readonly cluster: Cluster) {
        super(cluster.discord, 'shardReady', cluster.logger, (shardId) => {
            this.logger.cluster('shard', shardId, 'is ready');
            this.cluster.worker.send('shardReady', shardId);
        });
    }
}
