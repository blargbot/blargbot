import { ApiConnection } from '@blargbot/api';
import { GuildPermissionDetails } from '@blargbot/cluster/types';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ApiGetGuildPermissionHandler extends WorkerPoolEventService<ApiConnection, `getGuildPermission`> {
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.api,
            `getGuildPermission`,
            async ({ data, reply }) => reply(await this.getGuildPermission(data.guildId, data.userId))
        );
        this.#master = master;
    }

    protected async getGuildPermission(guildId: string, userId: string): Promise<GuildPermissionDetails | undefined> {
        const cluster = this.#master.clusters.getForGuild(guildId);
        return await cluster.request(`getGuildPermission`, { guildId, userId });
    }
}
