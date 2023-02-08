import type { BBTagContext, ChannelService, Entities, EntityQueryService, FindEntityOptions } from '@bbtag/blargbot';
import { catchErrors } from '@blargbot/catch-decorators';
import * as Eris from 'eris';

import type { Cluster } from '../../Cluster.js';
import { createEntityQueryService } from './createEntityQueryService.js';
import { createCancelledAlerter, createNotFoundAlerter } from './defaultAlerts.js';

const catchErisRESTErrors = catchErrors.async(Eris.DiscordRESTError, err => ({ error: err.message }));

export class ErisBBTagChannelService implements ChannelService {
    readonly #cluster: Cluster;
    readonly #querySingle: EntityQueryService<Entities.Channel>['querySingle'];

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
        this.#querySingle = createEntityQueryService({
            cacheKey: 'channel',
            find: (query, ctx) => cluster.util.findChannels(ctx.guild.id, query),
            getById: (id, ctx) => cluster.util.getChannel(ctx.guild.id, id),
            getId: c => c.id,
            // @ts-expect-error This is only a reference file for now
            pickBest: (choices, query, ctx) => cluster.util.queryChannel({ actors: ctx.user.id, context: ctx.channel, choices, filter: query }),
            alertCancelled: createCancelledAlerter('channel'),
            alertNotFound: createNotFoundAlerter('channel'),
            getResult: this.#convertToChannel.bind(this)
        });
    }

    #convertToChannel(channel: Eris.KnownGuildChannel): Entities.Channel {
        throw channel;
    }

    public async querySingle(context: BBTagContext, query: string, options?: FindEntityOptions | undefined): Promise<Entities.Channel | undefined> {
        return await this.#querySingle(context, query, options);
    }

    public async get(context: BBTagContext, id: string): Promise<Entities.Channel | undefined> {
        const channel = await this.#cluster.util.getChannel(context.guild.id, id);
        return channel === undefined ? undefined : this.#convertToChannel(channel);
    }

    public async getAll(context: BBTagContext): Promise<Entities.Channel[]> {
        const channels = await this.#cluster.util.findChannels(context.guild.id);
        return channels.map(this.#convertToChannel.bind(this));
    }

    public async getDmChannelId(_context: BBTagContext, userId: string): Promise<string> {
        const channel = await this.#cluster.discord.getDMChannel(userId);
        return channel.id;
    }

    @catchErisRESTErrors
    public async edit(context: BBTagContext, channelId: string, update: Partial<Entities.EditChannel>, reason?: string): Promise<undefined | { error: string; }> {
        await this.#cluster.discord.editChannel(channelId, update, reason ?? context.auditReason());
        return undefined;
    }

    @catchErisRESTErrors
    public async delete(context: BBTagContext, channelId: string, reason?: string): Promise<undefined | { error: string; }> {
        await this.#cluster.discord.deleteChannel(channelId, reason ?? context.auditReason());
        return undefined;
    }

    @catchErisRESTErrors
    public async create(context: BBTagContext, options: Entities.CreateChannel, reason?: string): Promise<Entities.Channel | { error: string; }> {
        const { name, type, permissionOverwrites, ...config } = options;
        const channel = await this.#cluster.discord.createChannel(context.guild.id, name, type, reason ?? context.auditReason(), {
            ...config, permissionOverwrites: permissionOverwrites?.map(p => ({
                ...p,
                allow: BigInt(p.allow),
                deny: BigInt(p.deny)
            }))
        });
        return (channel as Eris.Channel).toJSON() as unknown as Entities.Channel;
    }

    @catchErisRESTErrors
    public async setPermission(context: BBTagContext, channelId: string, overwrite: Entities.PermissionOverwrite, reason?: string): Promise<{ error: string; } | undefined> {
        if (overwrite.allow === '0' && overwrite.deny === '0')
            await this.#cluster.discord.deleteChannelPermission(channelId, overwrite.id, reason ?? context.auditReason());
        else
            await this.#cluster.discord.editChannelPermission(channelId, overwrite.id, BigInt(overwrite.allow), BigInt(overwrite.deny), overwrite.type, reason ?? context.auditReason());
        return undefined;
    }
}
