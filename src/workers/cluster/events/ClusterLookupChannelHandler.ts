import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { guard } from '@cluster/utils';
import { ProcessMessageHandler } from '@core/types';

export class ClusterLookupChannelHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'lookupChannel');
    }

    protected execute([data, , reply]: Parameters<ProcessMessageHandler>): void {
        if (typeof data === 'string') {
            const chan = this.cluster.discord.getChannel(data);
            if (chan !== undefined && guard.isGuildChannel(chan)) {
                return reply({ channel: chan.name, guild: chan.guild.name });
            }
        }
        reply(null);
    }
}
