import { ApiConnection } from '@api';
import { GuildPermissionDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

import { mapGuildPermissionDetailsList } from './ApiGetGuildPermissionHandler';

export class ApiGetGuildPermissionListHandler extends WorkerPoolEventService<ApiConnection, { userId: string; }, GuildPermissionDetails[]> {
    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getGuildPermssionList',
            mapping.mapObject({
                userId: mapping.mapString
            }),
            async ({ data, reply }) => reply(await this.getGuildPermissionList(data.userId))
        );
    }

    protected async getGuildPermissionList(userId: string): Promise<GuildPermissionDetails[]> {
        const results = new Map<string, GuildPermissionDetails>();

        await this.master.clusters.forEach(async (id, cluster) => {
            const response = await cluster?.request('getGuildPermssionList', { userId });
            const mapped = mapGuildPermissionDetailsList(response);
            if (!mapped.valid) {
                this.master.logger.error(`Cluster ${id} returned an invalid response to 'getGuildPermssionList'`, response);
            } else {
                for (const details of mapped.value)
                    results.set(details.guild.id, details);
            }
        });

        return [...results.values()];
    }
}
