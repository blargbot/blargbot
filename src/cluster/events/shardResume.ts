import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';

export class ShardResumeEventHandler extends DiscordEventService {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardResume', cluster.logger);
    }

    public execute(shardId: number): void {
        this.logger.cluster('shard', shardId, 'has resumed');
    }
}
