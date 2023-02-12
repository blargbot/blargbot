import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordRoleCacheMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #guildCreate = 'discord-role-cache-guild-create' as const;
    static readonly #guildUpdate = 'discord-role-cache-guild-update' as const;
    static readonly #guildDelete = 'discord-role-cache-guild-delete' as const;
    static readonly #roleCreate = 'discord-role-cache-create' as const;
    static readonly #roleDelete = 'discord-role-cache-delete' as const;
    static readonly #roleUpdate = 'discord-role-cache-update' as const;

    public constructor(options: DiscordRoleCacheMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordRoleCacheMessageBroker.#eventsName, 'topic', { durable: true });
    }

    public async handleGuildCreate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordRoleCacheMessageBroker.#eventsName,
            queue: DiscordRoleCacheMessageBroker.#guildCreate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildUpdate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordRoleCacheMessageBroker.#eventsName,
            queue: DiscordRoleCacheMessageBroker.#guildUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildDelete(handler: (message: discordeno.DiscordUnavailableGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordRoleCacheMessageBroker.#eventsName,
            queue: DiscordRoleCacheMessageBroker.#guildDelete,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_DELETE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleRoleCreate(handler: (message: discordeno.DiscordGuildRoleCreate, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordRoleCacheMessageBroker.#eventsName,
            queue: DiscordRoleCacheMessageBroker.#roleCreate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_ROLE_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleRoleUpdate(handler: (message: discordeno.DiscordGuildRoleUpdate, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordRoleCacheMessageBroker.#eventsName,
            queue: DiscordRoleCacheMessageBroker.#roleUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_ROLE_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleRoleDelete(handler: (message: discordeno.DiscordGuildRoleDelete, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordRoleCacheMessageBroker.#eventsName,
            queue: DiscordRoleCacheMessageBroker.#roleDelete,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_ROLE_DELETE`,
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

export interface DiscordRoleCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
