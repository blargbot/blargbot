import { ApiConnection } from '@api';
import { GuildPermissionDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ApiGetGuildPermissionHandler extends WorkerPoolEventService<ApiConnection, 'getGuildPermission'> {
    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getGuildPermission',
            async ({ data, reply }) => reply(await this.getGuildPermission(data.guildId, data.userId))
        );
    }

    protected async getGuildPermission(guildId: string, userId: string): Promise<GuildPermissionDetails | undefined> {
        const cluster = this.master.clusters.getForGuild(guildId);
        return await cluster.request('getGuildPermission', { guildId, userId });
    }
}
