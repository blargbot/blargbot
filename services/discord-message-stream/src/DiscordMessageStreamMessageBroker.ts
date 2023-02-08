import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordMessageStreamMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #messageStream = 'discord-message-stream' as const;

    public constructor(options: DiscordMessageStreamMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordMessageStreamMessageBroker.#messageStream, 'topic', { durable: true });
    }

    public async pushMessage(message: discordeno.DiscordMessage): Promise<void> {
        await this.sendMessage(DiscordMessageStreamMessageBroker.#messageStream, `${message.channel_id}.${message.author.id}`, this.jsonToBlob(message));
    }

    public async handleMessageCreate(handler: (message: discordeno.DiscordMessage, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordMessageStreamMessageBroker.#eventsName,
            queue: DiscordMessageStreamMessageBroker.#messageStream,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.MESSAGE_CREATE`,
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

export interface DiscordMessageStreamMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
