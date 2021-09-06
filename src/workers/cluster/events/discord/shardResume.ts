import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordShardResumeHandler extends DiscordEventService<'shardResume'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardResume', cluster.logger);
    }

    public execute(shardId: number): void {
        const shard = this.discord.ws.shards.get(shardId);
        const guilds = this.discord.guilds.cache.filter(g => g.shard.id === shardId);
        this.logger.shardi(`shard [${shardId}] has resumed G:${guilds.size} P:${shard?.ping ?? Infinity}ms`);
    }
}
