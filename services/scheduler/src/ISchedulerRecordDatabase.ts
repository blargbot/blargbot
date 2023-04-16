import type { ScheduledMessage } from '@blargbot/scheduler-client';

export interface ISchedulerRecordDatabase {
    get(ownerId: bigint, id: string): Awaitable<ScheduledMessage | undefined>;
    create(record: Omit<ScheduledMessage, 'id'>): Awaitable<string>;
    delete(ownerId: bigint, id: string): Awaitable<void>;
    deleteAll(records: Iterable<{ ownerId: bigint; id: string; }>): Awaitable<void>;

    list(ownerId: bigint, offset: number, count: number): Awaitable<ScheduledMessage[]>;
    count(ownerId: bigint): Awaitable<number>;
    clear(ownerId: bigint): Awaitable<void>;

    pending(): Awaitable<ScheduledMessage[]>;
}
