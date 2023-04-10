import type { DiscordChannelCacheHttpClient } from '@blargbot/discord-channel-cache-client';
import type { DiscordSelectOptionsRequest, DiscordSelectOptionsResponse } from '@blargbot/discord-choice-query-client';

export class DiscordChannelQueryService {
    readonly #channels: DiscordChannelCacheHttpClient;

    public constructor(channels: DiscordChannelCacheHttpClient) {
        this.#channels = channels;
    }

    public async renderChannelSelect(request: DiscordSelectOptionsRequest): Promise<DiscordSelectOptionsResponse> {
        const channels = await Promise.all(request.values.map(async c => [c, await this.#channels.getChannel({ channelId: c })] as const));
        return {
            prompt: 'Pick a channel', // TODO Respect locale and improve the message
            options: channels.map(([id, channel]) => ({
                label: channel?.name ?? 'UNKNOWN CHANNEL',
                description: `Id: ${id}`,
                value: id
            }))
        };
    }
}
