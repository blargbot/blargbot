import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';

const exchange = 'poll-scheduler';
export class SchedulerClockMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'fanout'));
    }

    public async tick(): Promise<void> {
        await this.#messages.publish(exchange, '', new Blob([]), {
            expiration: 1000
        });
    }

    public async handleTick(handler: (msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            queue: MessageHub.makeQueueName(this.#serviceName, exchange),
            filter: '*',
            async handle(_, msg) {
                return await handler(msg);
            }
        });
    }
}
