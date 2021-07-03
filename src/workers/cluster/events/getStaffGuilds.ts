import { Cluster } from '../Cluster';
import { ClusterEventService, mapping, ProcessMessageHandler } from '../core';


export class GetStaffGuildsHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getStaffGuilds');
    }

    protected async execute([data, , reply]: Parameters<ProcessMessageHandler>): Promise<void> {
        const res = [];
        const mapped = mapData(data);
        if (mapped.valid) {
            for (const guild of mapped.value.guilds) {
                if (this.cluster.discord.guilds.get(guild)) {
                    if (await this.cluster.util.isUserStaff(mapped.value.user, guild))
                        res.push(guild);
                }
            }
        }
        reply(res);
    }
}

const mapData = mapping.object<{ guilds: string[]; user: string; }>({
    guilds: mapping.array(mapping.string),
    user: mapping.string
});