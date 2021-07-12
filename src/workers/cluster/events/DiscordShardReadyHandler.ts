import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class DiscordShardReadyHandler extends DiscordEventService<'shardReady'> {
    public constructor(private readonly cluster: Cluster) {
        super(cluster.discord, 'shardReady', cluster.logger);
    }

    public execute(shardId: number): void {
        this.logger.cluster('shard', shardId, 'is ready');
        this.cluster.worker.send('shardReady', shardId);
    }
}
