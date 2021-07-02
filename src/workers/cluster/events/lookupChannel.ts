import { Cluster } from '../Cluster';
import { ClusterEventService, ProcessMessageHandler, guard } from '../core';


export class LookupChannelHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'lookupChannel');
    }

    protected execute([data, , reply]: Parameters<ProcessMessageHandler>): void {
        if (typeof data === 'string') {
            const chan = this.cluster.discord.getChannel(data);
            if (guard.isGuildChannel(chan)) {
                return reply({ channel: chan.name, guild: chan.guild.name });
            }
        }
        reply(null);
    }
}
