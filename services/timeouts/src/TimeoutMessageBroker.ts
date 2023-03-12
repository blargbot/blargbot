import type { ConsumeMessage, MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';
import type { TimeoutDetails } from '@blargbot/timeouts-client';
import { timeoutDetailsSerializer } from '@blargbot/timeouts-client';

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

    public async handleProcessTimeout(handler: (timeout: TimeoutDetails, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            queue: TimeoutMessageBroker.#pendingTimeouts,
            filter: '*',
            async handle(data, msg) {
                return await handler(await blobToJson(data, timeoutDetailsSerializer), msg);
            }
        });
    }
}
