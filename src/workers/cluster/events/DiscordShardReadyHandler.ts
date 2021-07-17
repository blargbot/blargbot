import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordShardReadyHandler extends DiscordEventService<'shardReady'> {
    public constructor(private readonly cluster: Cluster) {
        super(cluster.discord, 'shardReady', cluster.logger);
    }

    public execute(shardId: number): void {
        this.logger.cluster('shard', shardId, 'is ready');
        this.cluster.worker.send('shardReady', shardId);
    }
}
