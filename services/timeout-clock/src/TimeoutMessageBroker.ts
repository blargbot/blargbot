import MessageBroker from '@blargbot/message-broker';
import type * as amqplib from 'amqplib';

export class TimeoutMessageBroker extends MessageBroker {
    static readonly #pollTimeouts = 'poll-timeouts';

    protected override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            channel.assertQueue(TimeoutMessageBroker.#pollTimeouts, { durable: true })
        ]);
    }

    public async pollTimeouts(): Promise<void> {
        await this.send(TimeoutMessageBroker.#pollTimeouts, new Blob([]), {
            expiration: 1000
        });
    }
}
