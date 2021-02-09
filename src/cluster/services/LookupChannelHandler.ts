import { guard } from '../../newbu';
import { ClusterEventService } from '../../structures/ClusterEventService';
import { LookupChannelResult } from '../../workers/ClusterContract';
import { Cluster } from '../Cluster';


export class LookupChannelHandler extends ClusterEventService<'lookupChannel'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'lookupChannel');
    }

    protected execute(id: string, reply: (data: LookupChannelResult | null) => void): void {
        const chan = this.cluster.discord.getChannel(id);
        reply(guard.isGuildChannel(chan)
            ? { channel: chan.name, guild: chan.guild.name }
            : null);
    }
}
