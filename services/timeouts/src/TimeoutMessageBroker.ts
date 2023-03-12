import type { MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';
import type * as amqplib from 'amqplib';

import type { TimeoutDetails } from './TimeoutDetails.js';
import { timeoutDetailsSerializer } from './TimeoutDetails.js';

export class TimeoutMessageBroker {
    static readonly #pendingTimeouts = 'pending-timeouts';

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertQueue(TimeoutMessageBroker.#pendingTimeouts, {
            durable: true,
            arguments: {
                'x-cache-size': 1000,
                'x-cache-ttl': 2000,
                'x-message-deduplication': true
            }
        }));
    }

    public async requestProcessTimeout(timeout: TimeoutDetails): Promise<void> {
        const serialized = timeoutDetailsSerializer.write(timeout);
        await this.#messages.send(TimeoutMessageBroker.#pendingTimeouts, new Blob([serialized], { type: 'application/json' }), {
            headers: {
                'x-deduplication-header': timeout.id
            }
        });
    }

    public async sendEvent(queue: string, content: Blob, options: amqplib.Options.Publish): Promise<void> {
        await this.#messages.send(queue, content, options);
    }

    public async handleProcessTimeout(handler: (timeout: TimeoutDetails, msg: amqplib.ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            queue: TimeoutMessageBroker.#pendingTimeouts,
            filter: '*',
            async handle(data, msg) {
                return await handler(await blobToJson(data, timeoutDetailsSerializer), msg);
            }
        });
    }
}
