import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import type { MessageHandle } from '@blargbot/message-hub';
import type { IKVCache } from '@blargbot/redis-cache';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'GUILD_CREATE'
    | 'CHANNEL_CREATE'
    | 'MESSAGE_CREATE'
>;

export class DiscordMessageCacheService {
    readonly #gateway: DiscordGatewayMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #cache: IKVCache<bigint, bigint>;

    public constructor(gateway: DiscordGatewayMessageBroker, cache: IKVCache<bigint, bigint>) {
        this.#gateway = gateway;
        this.#cache = cache;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleGuildCreate(this.#handleGuildCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleChannelCreate(this.#handleChannelCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
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

    async #handleGuildCreate(message: Discord.GatewayGuildCreateDispatchData): Promise<void> {
        await this.#setLastMessageTime(message.channels.map(c => [c.id, getLastMessageId(c)]));
    }

    async #handleChannelCreate(message: Discord.GatewayChannelCreateDispatchData): Promise<void> {
        await this.#setLastMessageTime([[message.id, getLastMessageId(message)]]);
    }

    async #handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
        await this.#setLastMessageTime([[message.channel_id, message.id]]);
    }
}

function getLastMessageId(channel: Discord.APIChannel): string | null {
    return 'last_message_id' in channel ? channel.last_message_id ?? null : null;
}
