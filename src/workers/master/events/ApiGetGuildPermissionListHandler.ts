import { ApiConnection } from '@api';
import { GuildPermissionDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ApiGetGuildPermissionListHandler extends WorkerPoolEventService<ApiConnection, 'getGuildPermissionList'> {
    public constructor(private readonly master: Master) {
        super(master.api, 'getGuildPermissionList', async ({ data, reply }) => reply(await this.getGuildPermissionList(data.userId)));
    }

    protected async getGuildPermissionList(userId: string): Promise<GuildPermissionDetails[]> {
        const results = new Map<string, GuildPermissionDetails>();

        await this.master.clusters.forEach(async (_, cluster) => {
            const response = await cluster?.request('getGuildPermissionList', { userId });
            if (response === undefined)
                return;

            for (const details of response)
                results.set(details.guild.id, details);
        });

        return [...results.values()];
    }
}
