import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordShardResumeHandler extends DiscordEventService<'shardResume'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardResume', cluster.logger, (shardId) => {
            const shard = this.discord.shards.get(shardId);
            const guilds = this.discord.guilds.filter(g => g.shard.id === shardId);
            this.logger.shardi(`shard [${shardId}] has resumed G:${guilds.length} P:${shard?.latency ?? Infinity}ms`);
        });
    }
}
