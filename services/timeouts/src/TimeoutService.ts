import type { MessageHub } from '@blargbot/message-hub';
import type { TimeoutDetails } from '@blargbot/timeouts-client';

import type { ITimeoutRecordDatabase } from './ITimeoutRecordDatabase.js';
import type { TimeoutMessageBroker } from './TimeoutMessageBroker.js';

export class TimeoutService {
    readonly #database: ITimeoutRecordDatabase;
    readonly #timeouts: TimeoutMessageBroker;
    readonly #messages: MessageHub;

    public constructor(
        database: ITimeoutRecordDatabase,
        timeouts: TimeoutMessageBroker,
        messages: MessageHub) {
        this.#database = database;
        this.#timeouts = timeouts;
        this.#messages = messages;
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

    public async handleTick(): Promise<void> {
        const pending = await this.#database.pending();
        if (pending.length === 0)
            return;

        await Promise.all([
            this.#database.deleteAll(pending),
            ...pending.map(t => this.#queueTimeout(t))
        ]);
    }

    async #queueTimeout(timeout: TimeoutDetails): Promise<void> {
        try {
            await this.#timeouts.requestProcessTimeout(timeout);
        } catch (error) {
            const { data, ...debug } = timeout;
            console.error('Failed to process timeout', debug, error);
        }
    }

    public async handleProcessTimeout(timeout: TimeoutDetails): Promise<void> {
        try {
            await this.#messages.send(timeout.queue, timeout.data, timeout.options);
        } catch (err) {
            const { data: _, ...slimTimeout } = timeout;
            console.error('Error while processing timeout', slimTimeout, err);
        }
    }

}
