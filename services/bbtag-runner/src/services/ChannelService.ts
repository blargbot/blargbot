import type { BBTagRuntime, ChannelService as BBTagChannelService, Entities, FindEntityOptions } from '@bbtag/blargbot';
import type { DiscordChannelCacheHttpClient } from '@blargbot/discord-channel-cache-client';
import type { DiscordChannelSearchHttpClient } from '@blargbot/discord-channel-search-client';
import type { DiscordChoiceQueryMessageBroker } from '@blargbot/discord-choice-query-client';
import { isGuildChannel } from '@blargbot/discord-util';

import { QueryService } from './QueryService.js';

export class ChannelService implements BBTagChannelService {
    readonly #query: QueryService<Entities.Channel>;
    readonly #search: DiscordChannelSearchHttpClient;
    readonly #channels: DiscordChannelCacheHttpClient;

    public constructor(
        search: DiscordChannelSearchHttpClient,
        channels: DiscordChannelCacheHttpClient,
        choose: DiscordChoiceQueryMessageBroker
    ) {
        this.#query = new QueryService<Entities.Channel>({
            search: (ctx, query) => this.#find(ctx, query),
            resolve: (ctx, id) => this.get(ctx, id),
            choose,
            type: 'discord-channel-query',
            alertCancelled: (ctx) => `Channel query cancelled in ${ctx.type} \`${ctx.entrypoint.name}\``,
            alertFailed: (ctx, query) => `No channel matching \`${query}\` found in ${ctx.type} \`${ctx.entrypoint.name}\`.`
        });

        this.#search = search;
        this.#channels = channels;
    }

    async #find(context: BBTagRuntime, query: string): Promise<string[]> {
        const results = await this.#search.search({
            ownerId: BigInt(context.guild.id),
            query
        });
        return results.map(c => c.toString());
    }

    public getDmChannelId(context: BBTagRuntime, userId: string): Promise<string> {
        context;
        userId;
        throw new Error('Method not implemented.');
    }

    public edit(context: BBTagRuntime, channelId: string, update: Partial<Entities.EditChannel>, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        channelId;
        update;
        reason;
        throw new Error('Method not implemented.');
    }

    public delete(context: BBTagRuntime, channelId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        channelId;
        reason;
        throw new Error('Method not implemented.');
    }

    public create(context: BBTagRuntime, options: Entities.CreateChannel, reason?: string | undefined): Promise<Entities.Channel | { error: string; }> {
        context;
        options;
        reason;
        throw new Error('Method not implemented.');
    }

    public setPermission(context: BBTagRuntime, channelId: string, overwrite: Entities.PermissionOverwrite, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        channelId;
        overwrite;
        reason;
        throw new Error('Method not implemented.');
    }

    public async querySingle(context: BBTagRuntime, query: string, options?: FindEntityOptions | undefined): Promise<Entities.Channel | undefined> {
        return await this.#query.querySingle(context, query, options);
    }

    public async get(context: BBTagRuntime, id: string): Promise<Entities.Channel | undefined> {
        const channel = await this.#channels.getChannel({ channelId: BigInt(id) });
        if (channel === undefined)
            return undefined;

        if (!isGuildChannel(channel) || channel.guild_id !== context.guild.id.toString())
            return undefined;

        return channel;
    }

    public async getAll(context: BBTagRuntime): Promise<Entities.Channel[]> {
        const channels = await this.#channels.getGuildChannels({ guildId: BigInt(context.guild.id) });
        return channels.filter(isGuildChannel);
    }
}
