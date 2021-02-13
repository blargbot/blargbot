import { guard } from '../../utils';
import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';


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
