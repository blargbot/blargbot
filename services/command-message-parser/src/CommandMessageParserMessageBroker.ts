import type { ExtendedMessage } from '@blargbot/discord-message-stream-contract';
import type { MessageCommandDetails } from '@blargbot/message-command-contract';
import type { MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob } from '@blargbot/message-hub';
import type amqplib from 'amqplib';

export class CommandMessageParserMessageBroker {
    static readonly #messageStream = 'discord-message-stream';
    static readonly #commandParse = 'discord-message-command-parser';
    static readonly #commands = 'discord-message-commands';
    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;
        this.#messages.onConnected(c => Promise.all([
            c.assertExchange(CommandMessageParserMessageBroker.#messageStream, 'topic', { durable: true }),
            c.assertExchange(CommandMessageParserMessageBroker.#commands, 'topic', { durable: true })
        ]));
    }

    public async sendCommand(details: MessageCommandDetails): Promise<void> {
        await this.#messages.publish(CommandMessageParserMessageBroker.#commands, `${details.guild_id ?? ''}.${details.command}`, jsonToBlob(details));
    }

    public async handleMessageCreate(handler: (message: ExtendedMessage, msg: amqplib.ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: CommandMessageParserMessageBroker.#messageStream,
            queue: CommandMessageParserMessageBroker.#commandParse,
            filter: '#',
            async handle(data, msg) {
                return await handler(await blobToJson(data), msg);
            }
        });
    }
}
