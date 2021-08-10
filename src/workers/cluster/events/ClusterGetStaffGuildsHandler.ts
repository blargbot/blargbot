import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { mapping } from '@cluster/utils';
import { ProcessMessageHandler } from '@core/types';

export class ClusterGetStaffGuildsHandler extends ClusterEventService {
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
                if (this.cluster.discord.guilds.cache.get(guild) !== undefined) {
                    if (await this.cluster.util.isUserStaff(mapped.value.user, guild))
                        res.push(guild);
                }
            }
        }
        reply(res);
    }
}

const mapData = mapping.mapObject<{ guilds: string[]; user: string; }>({
    guilds: mapping.mapArray(mapping.mapString),
    user: mapping.mapString
});
