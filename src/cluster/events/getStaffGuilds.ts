import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';


export class GetStaffGuildsHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getStaffGuilds');
    }

    protected async execute([data, , reply]: Parameters<ProcessMessageHandler>): Promise<void> {
        const res = [];
        for (const guild of data.guilds) {
            if (this.cluster.discord.guilds.get(guild)) {
                if (await this.cluster.util.isUserStaff(data.user, guild))
                    res.push(guild);
            }
        }
        reply(res);
    }
}