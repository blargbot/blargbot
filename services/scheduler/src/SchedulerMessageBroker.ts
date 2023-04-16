import type { ConsumeMessage, MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';
import type { ScheduledMessage } from '@blargbot/scheduler-client';
import { scheduledMessageSerializer } from '@blargbot/scheduler-client';

const exchange = 'pending-scheduled-messages';
export class SchedulerMessageBroker {
    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertQueue(exchange, {
            durable: true,
            arguments: {
                'x-cache-size': 1000,
                'x-cache-ttl': 2000,
                'x-message-deduplication': true
            }
        }));
    }

    public async requestProcessScheduledMessage(message: ScheduledMessage): Promise<void> {
        const serialized = await scheduledMessageSerializer.write(message);
        await this.#messages.send(exchange, new Blob([serialized], { type: 'application/json' }), {
            headers: {
                'x-deduplication-header': message.id
            }
        });
    }

    public async processScheduledMessage(handler: (message: ScheduledMessage, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            queue: exchange,
            filter: '*',
            async handle(data, msg) {
                return await handler(await blobToJson(data, scheduledMessageSerializer), msg);
            }
        });
    }
}
