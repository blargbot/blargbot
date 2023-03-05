import type { ExtendedMessage } from '@blargbot/discord-message-stream-contract';
import type { MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type { MessageCommandDetails } from '@blargbot/message-command-contract';
import type amqplib from 'amqplib';

export class DCommandMessageParserMessageBroker extends MessageBroker {
    static readonly #messageStream = 'discord-message-stream';
    static readonly #commandParse = 'discord-message-command-parser';
    static readonly #commands = 'discord-message-commands';

    protected override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            super.onceConnected(channel),
            channel.assertExchange(DCommandMessageParserMessageBroker.#messageStream, 'topic', { durable: true }),
            channel.assertExchange(DCommandMessageParserMessageBroker.#commands, 'topic', { durable: true })
        ]);
    }

    public async sendCommand(details: MessageCommandDetails): Promise<void> {
        await this.publish(DCommandMessageParserMessageBroker.#commands, `${details.guild_id ?? ''}.${details.command}`, this.jsonToBlob(details));
    }

    public async handleMessageCreate(handler: (message: ExtendedMessage, msg: amqplib.ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: DCommandMessageParserMessageBroker.#messageStream,
            queue: DCommandMessageParserMessageBroker.#commandParse,
            filter: '#',
            async handle(data, msg) {
                if (data.type !== 'application/json')
                    throw new Error('Content type must be application/json');
                const raw = await data.text();
                return await handler(JSON.parse(raw) as never, msg);
            }
        });
    }
}
