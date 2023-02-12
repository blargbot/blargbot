import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordGuildCacheMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #guildCreate = 'discord-guild-cache-create' as const;
    static readonly #guildUpdate = 'discord-guild-cache-update' as const;
    static readonly #guildDelete = 'discord-guild-cache-delete' as const;

    public constructor(options: DiscordGuildCacheMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordGuildCacheMessageBroker.#eventsName, 'topic', { durable: true });
    }

    public async handleGuildCreate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordGuildCacheMessageBroker.#eventsName,
            queue: DiscordGuildCacheMessageBroker.#guildCreate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildUpdate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordGuildCacheMessageBroker.#eventsName,
            queue: DiscordGuildCacheMessageBroker.#guildUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildDelete(handler: (message: discordeno.DiscordUnavailableGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordGuildCacheMessageBroker.#eventsName,
            queue: DiscordGuildCacheMessageBroker.#guildDelete,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_DELETE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    async #getMessageDetails<T>(data: Blob): Promise<T> {
        const message = await this.blobToJson<{ event: { d: T; }; }>(data);
        return message.event.d;
    }

}

export interface DiscordGuildCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
