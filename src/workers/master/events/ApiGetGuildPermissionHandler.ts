import { ApiConnection } from '@api';
import { GuildPermissionDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ApiGetGuildPermissionHandler extends WorkerPoolEventService<ApiConnection, { userId: string; guildId: string; }, GuildPermissionDetails | undefined> {
    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getGuildPermssion',
            mapping.mapObject({
                guildId: mapping.mapString,
                userId: mapping.mapString
            }),
            async ({ data, reply }) => reply(await this.getGuildPermission(data.guildId, data.userId))
        );
    }

    protected async getGuildPermission(guildId: string, userId: string): Promise<GuildPermissionDetails | undefined> {
        const cluster = this.master.clusters.getForGuild(guildId);
        const response = await cluster.request('getGuildPermssion', { guildId, userId });
        const mapped = mapGuildPermissionDetails(response);
        if (mapped.valid)
            return mapped.value;

        this.master.logger.error(`Cluster ${cluster.id} returned an invalid response to 'getGuildPermssion'`, response);
        return undefined;
    }
}
export const mapGuildPermissionDetailsList = mapping.mapArray(
    mapping.mapObject<GuildPermissionDetails>({
        autoresponses: mapping.mapBoolean,
        ccommands: mapping.mapBoolean,
        censors: mapping.mapBoolean,
        farewell: mapping.mapBoolean,
        greeting: mapping.mapBoolean,
        guild: mapping.mapObject({
            iconUrl: mapping.mapOptionalString,
            id: mapping.mapString,
            name: mapping.mapString
        }),
        interval: mapping.mapBoolean,
        rolemes: mapping.mapBoolean,
        userId: mapping.mapString
    })
);

const mapGuildPermissionDetails = mapping.mapChoice(
    mapping.mapIn(undefined),
    mapping.mapObject<GuildPermissionDetails>({
        autoresponses: mapping.mapBoolean,
        ccommands: mapping.mapBoolean,
        censors: mapping.mapBoolean,
        farewell: mapping.mapBoolean,
        greeting: mapping.mapBoolean,
        guild: mapping.mapObject({
            iconUrl: mapping.mapOptionalString,
            id: mapping.mapString,
            name: mapping.mapString
        }),
        interval: mapping.mapBoolean,
        rolemes: mapping.mapBoolean,
        userId: mapping.mapString
    })
);
