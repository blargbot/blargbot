import type Discord from '@blargbot/discord-types';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

export interface ExtendedMessage extends Discord.GatewayMessageCreateDispatchData {
    readonly channel: Discord.APIChannel;
    readonly guild?: Discord.APIGuild;
}
const exchange = 'discord-message-stream';
export class DiscordMessageStreamMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'topic'));
    }

    public async handleMessage(handler: (payload: ExtendedMessage, msg: ConsumeMessage) => Awaitable<void>, options: DiscordMessageStreamHandlerOptions = {}): Promise<MessageHandle> {
        const guildId = options.guildId === null ? 'dm' : options.guildId ?? '*';

        return await this.#messages.handleMessage({
            exchange: exchange,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, options.queueName),
            filter: `${guildId}.${options.channelId ?? '*'}.${options.authorId ?? '*'}`,
            async handle(data, msg) {
                return await handler(await blobToJson(data), msg);
            }
        });
    }

    public async pushMessage(message: ExtendedMessage): Promise<void> {
        await this.#messages.publish(exchange, `${message.guild_id ?? 'dm'}.${message.channel_id}.${message.author.id}`, await jsonToBlob(message));
    }
}

export interface DiscordMessageStreamHandlerOptions {
    readonly queueName?: string;
    readonly guildId?: string | bigint | null;
    readonly channelId?: string | bigint;
    readonly authorId?: string | bigint;
}
