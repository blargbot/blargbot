import type { MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type * as amqplib from 'amqplib';

import type { TimeoutDetails } from './TimeoutDetails.js';
import { timeoutDetailsSerializer } from './TimeoutDetails.js';

export class TimeoutMessageBroker extends MessageBroker {
    static readonly #pendingTimeouts = 'pending-timeouts';
    static readonly #pollTimeouts = 'poll-timeouts';

    protected override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            channel.assertQueue(TimeoutMessageBroker.#pendingTimeouts, {
                durable: true,
                arguments: {
                    'x-cache-size': 1000,
                    'x-cache-ttl': 2000,
                    'x-message-deduplication': true
                }
            })
        ]);
    }

    public async requestProcessTimeout(timeout: TimeoutDetails): Promise<void> {
        const serialized = timeoutDetailsSerializer.write(timeout);
        await this.send(TimeoutMessageBroker.#pendingTimeouts, new Blob([serialized], { type: 'application/json' }), {
            headers: {
                'x-deduplication-header': timeout.id
            }
        });
    }

    public async sendEvent(queue: string, content: Blob, options: amqplib.Options.Publish): Promise<void> {
        await this.send(queue, content, options);
    }

    public async handleProcessTimeout(handler: (timeout: TimeoutDetails, msg: amqplib.ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            queue: TimeoutMessageBroker.#pendingTimeouts,
            filter: '*',
            async handle(data, msg) {
                if (data.type !== 'application/json')
                    throw new Error('Content type must be application/json');
                const raw = await data.text();
                return await handler(timeoutDetailsSerializer.read(raw), msg);
            }
        });
    }

    public async handlePollTimeouts(handler: (msg: amqplib.ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            queue: TimeoutMessageBroker.#pollTimeouts,
            filter: '*',
            async handle(_, msg) {
                return await handler(msg);
            }
        });
    }
}
