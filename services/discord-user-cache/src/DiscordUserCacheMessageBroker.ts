import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordUserCacheMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #guildCreate = 'discord-user-cache-guild-create' as const;
    static readonly #guildUpdate = 'discord-user-cache-guild-update' as const;
    static readonly #memberAdd = 'discord-user-cache-member-add' as const;
    static readonly #userUpdate = 'discord-user-cache-update' as const;
    static readonly #ready = 'discord-user-cache-ready' as const;
    static readonly #membersChunk = 'discord-user-cache-members-chunk' as const;
    static readonly #banAdd = 'discord-user-cache-ban-add' as const;
    static readonly #banRemove = 'discord-user-cache-ban-remove' as const;
    static readonly #interaction = 'discord-user-cache-interaction' as const;
    static readonly #presence = 'discord-user-cache-presence' as const;

    public constructor(options: DiscordUserCacheMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordUserCacheMessageBroker.#eventsName, 'topic', { durable: true });
    }

    public async handleGuildCreate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#guildCreate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleGuildUpdate(handler: (message: discordeno.DiscordGuild, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#guildUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleMemberAdd(handler: (message: discordeno.DiscordGuildMemberAdd, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#memberAdd,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_MEMBER_ADD`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleMembersChunk(handler: (message: discordeno.DiscordGuildMembersChunk, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#membersChunk,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_MEMBERS_CHUNK`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleUserUpdate(handler: (message: discordeno.DiscordUser, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#userUpdate,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.USER_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleReady(handler: (message: discordeno.DiscordReady, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#ready,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.READY`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleBanAdd(handler: (message: discordeno.DiscordGuildBanAddRemove, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#banAdd,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_BAN_ADD`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleBanRemove(handler: (message: discordeno.DiscordGuildBanAddRemove, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#banRemove,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.GUILD_BAN_REMOVE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleInteraction(handler: (message: discordeno.DiscordInteraction, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#interaction,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.INTERACTION_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handlePresence(handler: (message: discordeno.DiscordPresenceUpdate, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordUserCacheMessageBroker.#eventsName,
            queue: DiscordUserCacheMessageBroker.#presence,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.PRESENCE_UPDATE`,
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

export interface DiscordUserCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
