import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordShardDisconnectHandler extends DiscordEventService<'shardDisconnect'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'shardDisconnect', cluster.logger, (error, shardId) => {
            this.logger.cluster('shard', shardId, 'has disconnected', error);
            // setTimeout(() => {
            //     const shard = this.discord.ws.shards.get(shardId);
            //     if (shard === undefined)
            //         return;

            //     switch (shard.status) {
            //         case connecting:
            //         case ready:
            //             break;
            //         default:
            //             void shard['connect']();
            //     }
            // }, 5000);
        });
    }
}

// const connecting: ConstantsStatus['CONNECTING'] = 1;
// const ready: ConstantsStatus['READY'] = 0;
