import type { MessageHandle, MessageHub } from '@blargbot/message-hub';
import type { TimeoutClockMessageBroker } from '@blargbot/timeout-clock-client';
import type { TimeoutDetails } from '@blargbot/timeouts-client';

import type { ITimeoutRecordDatabase } from './ITimeoutRecordDatabase.js';
import type { TimeoutMessageBroker } from './TimeoutMessageBroker.js';

export class TimeoutService {
    readonly #database: ITimeoutRecordDatabase;
    readonly #handles: Set<MessageHandle>;
    readonly #timeouts: TimeoutMessageBroker;
    readonly #clock: TimeoutClockMessageBroker;
    readonly #messages: MessageHub;

    public constructor(
        database: ITimeoutRecordDatabase,
        timeouts: TimeoutMessageBroker,
        clock: TimeoutClockMessageBroker,
        messages: MessageHub) {
        this.#database = database;
        this.#timeouts = timeouts;
        this.#messages = messages;
        this.#clock = clock;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#clock.handleTick(this.#handleTick.bind(this)).then(h => this.#handles.add(h)),
            this.#timeouts.handleProcessTimeout(this.#handleProcessTimeout.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    public async createTimeout(timeout: Omit<TimeoutDetails, 'id'>): Promise<string> {
        return await this.#database.create(timeout);
    }

    public async getTimeout(ownerId: bigint, id: string): Promise<TimeoutDetails | undefined> {
        return await this.#database.get(ownerId, id);
    }

    public async deleteTimeout(ownerId: bigint, id: string): Promise<void> {
        return await this.#database.delete(ownerId, id);
    }

    public async listTimeout(ownerId: bigint, offset: number, count: number): Promise<TimeoutDetails[]> {
        return await this.#database.list(ownerId, offset, count);
    }

    public async countTimeout(ownerId: bigint): Promise<number> {
        return await this.#database.count(ownerId);
    }

    public async clearTimeout(ownerId: bigint): Promise<void> {
        return await this.#database.clear(ownerId);
    }

    async #handleTick(): Promise<void> {
        const pending = await this.#database.pending();
        if (pending.length === 0)
            return;

        const deletePending = this.#database.deleteAll(pending);
        for (const timeout of pending) {
            try {
                await this.#timeouts.requestProcessTimeout(timeout);
            } catch (error) {
                const { data, ...debug } = timeout;
                console.error('Failed to process timeout', debug, error);
            }
        }
        await deletePending;
    }

    async #handleProcessTimeout(timeout: TimeoutDetails): Promise<void> {
        try {
            await this.#messages.send(timeout.queue, new Blob([timeout.data], { type: timeout.dataType }), timeout.options);
        } catch (err) {
            const { data: _, ...slimTimeout } = timeout;
            console.error('Error while processing timeout', slimTimeout, err);
        }
    }

}
