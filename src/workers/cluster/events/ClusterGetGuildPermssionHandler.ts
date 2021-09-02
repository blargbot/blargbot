import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { GuildPermissionDetails } from '@cluster/types';
import { mapping } from '@core/utils';

export class ClusterGetGuildPermssionHandler extends ClusterEventService<{ userId: string; guildId: string; }, GuildPermissionDetails | undefined> {
    public constructor(
        cluster: Cluster
    ) {
        super(
            cluster,
            'getGuildPermssion',
            mapping.mapObject({
                guildId: mapping.mapString,
                userId: mapping.mapString
            }),
            async ({ data, reply }) => reply(await this.getGuildPermissions(data.guildId, data.userId))
        );
    }

    protected getGuildPermissions(guildId: string, userId: string): Promise<GuildPermissionDetails> {
        throw new Error(guildId + userId);
    }
}
