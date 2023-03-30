import type { ExtendedMessage } from '@blargbot/discord-message-stream-client';
import type { StringSlice } from '@blargbot/input';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

export interface MessageCommandDetails extends ExtendedMessage {
    readonly prefix: string;
    readonly command: string;
    readonly args: StringSlice[];
}

const exchange = 'command-messages';
export class CommandMessageParserMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'topic'));
    }

    public async handleCommand(handler: (payload: MessageCommandDetails, msg: ConsumeMessage) => Awaitable<void>, options: CommandMessageParserHandlerOptions = {}): Promise<MessageHandle> {
        const guildId = options.guildId === null ? 'dm' : options.guildId ?? '*';

        return await this.#messages.handleMessage({
            exchange: exchange,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, options.queueName),
            filter: `${guildId}.${options.command ?? '*'}`,
            async handle(data, msg) {
                return await handler(await blobToJson(data), msg);
            }
        });
    }

    public async sendCommand(details: MessageCommandDetails): Promise<void> {
        await this.#messages.publish(exchange, `${details.guild_id ?? 'dm'}.${details.command}`, await jsonToBlob(details));
    }
}

export interface CommandMessageParserHandlerOptions {
    readonly queueName?: string;
    readonly guildId?: string | bigint | null;
    readonly command?: string | bigint;
}
