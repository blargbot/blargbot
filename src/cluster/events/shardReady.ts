import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';

export class ShardReadyHandler extends DiscordEventService {
    public constructor(private readonly cluster: Cluster) {
        super(cluster.discord, 'shardReady', cluster.logger);
    }

    public execute(shardId: number): void {
        this.logger.cluster('shard', shardId, 'is ready');
        this.cluster.worker.send('shardReady', shardId);
    }
}