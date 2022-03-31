import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordShardDisconnectHandler extends DiscordEventService<'shardDisconnect'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardDisconnect', cluster.logger, (error, shardId) => {
            this.logger.shardi('shard', shardId, 'has disconnected', error?.message);
        });
    }
}

// const connecting: ConstantsStatus['CONNECTING'] = 1;
// const ready: ConstantsStatus['READY'] = 0;
