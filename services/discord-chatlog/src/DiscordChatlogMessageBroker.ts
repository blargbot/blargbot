import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordChatlogMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #chatlogName = 'discord-chatlog-message' as const;
    static readonly #messageCreateName = `${this.#chatlogName}-create` as const;
    static readonly #messageUpdateName = `${this.#chatlogName}-update` as const;
    static readonly #messageDeleteName = `${this.#chatlogName}-delete` as const;
    static readonly #messageDeleteBulkName = `${this.#messageDeleteName}-bulk` as const;

    public constructor(options: DiscordChatlogMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordChatlogMessageBroker.#eventsName, 'topic', { durable: true });
    }

    public async handleMessageCreate(handler: (message: discordeno.DiscordMessage, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordChatlogMessageBroker.#eventsName,
            queue: DiscordChatlogMessageBroker.#messageCreateName,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.MESSAGE_CREATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }
    public async handleMessageUpdate(handler: (message: discordeno.DiscordMessage, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordChatlogMessageBroker.#eventsName,
            queue: DiscordChatlogMessageBroker.#messageUpdateName,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.MESSAGE_UPDATE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleMessageDelete(handler: (message: discordeno.DiscordMessageDelete, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordChatlogMessageBroker.#eventsName,
            queue: DiscordChatlogMessageBroker.#messageDeleteName,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.MESSAGE_DELETE`,
            async handle(data, msg) {
                await handler(await this.#getMessageDetails(data), msg);
            }
        });
    }

    public async handleMessageDeleteBulk(handler: (message: discordeno.DiscordMessageDeleteBulk, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordChatlogMessageBroker.#eventsName,
            queue: DiscordChatlogMessageBroker.#messageDeleteBulkName,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.MESSAGE_DELETE_BULK`,
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

export interface DiscordChatlogMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
