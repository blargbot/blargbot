import type Discord from '@blargbot/discord-types';
import type { IKVCache } from '@blargbot/redis-cache';

export class DiscordMessageCacheService {
    readonly #cache: IKVCache<bigint, bigint>;

    public constructor(cache: IKVCache<bigint, bigint>) {
        this.#cache = cache;
    }

    public async getLastMessageId(channelId: bigint): Promise<bigint | undefined> {
        return await this.#cache.get(channelId);
    }

    async #setLastMessageTime(values: Iterable<[channelId: string, messageId: string | null]>): Promise<void> {
        const promises = [];
        const toSet = [];
        for (const [channelId, messageId] of values) {
            if (messageId === null)
                promises.push(this.#cache.delete(BigInt(channelId)));
            else
                toSet.push([BigInt(channelId), BigInt(messageId)] as const);
        }
        promises.push(this.#cache.setAll(toSet));
        await Promise.all(promises);
    }

    public async handleGuildCreate(message: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#setLastMessageTime(message.channels.map(c => [c.id, getLastMessageId(c)]));
    }

    public async handleChannelCreate(message: Discord.GatewayChannelCreateDispatchData): Promise<void> {
        await this.#setLastMessageTime([[message.id, getLastMessageId(message)]]);
    }

    public async handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
        await this.#setLastMessageTime([[message.channel_id, message.id]]);
    }
}

function getLastMessageId(channel: Discord.APIChannel): string | null {
    return 'last_message_id' in channel ? channel.last_message_id ?? null : null;
}
