import type { MessageHub } from '@blargbot/message-hub';

export class TimeoutMessageBroker {
    static readonly #pollTimeouts = 'poll-timeouts';

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertQueue(TimeoutMessageBroker.#pollTimeouts, { durable: true }));
    }

    public async pollTimeouts(): Promise<void> {
        await this.#messages.send(TimeoutMessageBroker.#pollTimeouts, new Blob([]), {
            expiration: 1000
        });
    }
}
