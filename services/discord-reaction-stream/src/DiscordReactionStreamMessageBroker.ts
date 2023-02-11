import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export class DiscordReactionStreamMessageBroker extends MessageBroker {
    static readonly #eventsName = 'discord-gateway-events' as const;
    static readonly #reactionStream = 'discord-reaction-stream' as const;

    public constructor(options: DiscordReactionStreamMessageBrokerOptions) {
        super(options);
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(DiscordReactionStreamMessageBroker.#reactionStream, 'topic', { durable: true });
    }

    public async pushReaction(message: discordeno.DiscordMessageReactionAdd): Promise<void> {
        const emoteId = message.emoji.id ?? message.emoji.name ?? '';
        await this.sendMessage(DiscordReactionStreamMessageBroker.#reactionStream, `${message.message_id}.${message.user_id}.${emoteId}`, this.jsonToBlob(message));
    }

    public async handleReactionAdd(handler: (message: discordeno.DiscordMessageReactionAdd, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DiscordReactionStreamMessageBroker.#eventsName,
            queue: DiscordReactionStreamMessageBroker.#reactionStream,
            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.MESSAGE_REACTION_ADD`,
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

export interface DiscordReactionStreamMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
