import { ClusterEventService } from '../../structures/ClusterEventService';
import { Cluster } from '../Cluster';


export class GetStaffGuildsHandler extends ClusterEventService<'getStaffGuilds'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getStaffGuilds');
    }

    protected async execute(request: { user: string; guilds: string[]; }, reply: (data: string[]) => void): Promise<void> {
        const res = [];
        for (const guild of request.guilds) {
            if (this.cluster.discord.guilds.get(guild)) {
                if (await this.cluster.util.isUserStaff(request.user, guild))
                    res.push(guild);
            }
        }
        reply(res);
    }
}
