import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordMemberCacheMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #guildCreate = 'discord-member-cache-guild-create' as const;
    static readonly #guildUpdate = 'discord-member-cache-guild-update' as const;
    static readonly #guildDelete = 'discord-member-cache-guild-delete' as const;
    static readonly #memberAdd = 'discord-member-cache-add' as const;
    static readonly #memberRemove = 'discord-member-cache-remove' as const;
    static readonly #memberUpdate = 'discord-member-cache-update' as const;
    static readonly #memberChunk = 'discord-member-cache-chunk' as const;

    public constructor(options: DiscordMemberCacheMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordMemberCacheMessageBroker.#eventsName, 'topic', { durable: true });
    }

    public async handleGuildCreate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#guildCreate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildUpdate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#guildUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildDelete(handler: (message: discordeno.DiscordUnavailableGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#guildDelete,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_DELETE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleMemberAdd(handler: (message: discordeno.DiscordGuildMemberAdd, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#memberAdd,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_MEMBER_ADD`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }
    public async handleMemberRemove(handler: (message: discordeno.DiscordGuildMemberRemove, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#memberRemove,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_MEMBER_REMOVE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }
    public async handleMemberUpdate(handler: (message: discordeno.DiscordGuildMemberUpdate, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#memberUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_MEMBER_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }
    public async handleMembersChunk(handler: (message: discordeno.DiscordGuildMembersChunk, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMemberCacheMessageBroker.#eventsName,
            queue: DiscordMemberCacheMessageBroker.#memberChunk,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_MEMBERS_CHUNK`,
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

export interface DiscordMemberCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
