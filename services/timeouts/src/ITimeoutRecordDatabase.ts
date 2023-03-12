import type { TimeoutDetails } from '@blargbot/timeouts-client';

export interface ITimeoutRecordDatabase {
    get(ownerId: bigint, id: string): Awaitable<TimeoutDetails | undefined>;
    create(record: Omit<TimeoutDetails, 'id'>): Awaitable<string>;
    delete(ownerId: bigint, id: string): Awaitable<void>;
    deleteAll(records: Iterable<{ ownerId: bigint; id: string; }>): Awaitable<void>;

    list(ownerId: bigint, offset: number, count: number): Awaitable<TimeoutDetails[]>;
    count(ownerId: bigint): Awaitable<number>;
    clear(ownerId: bigint): Awaitable<void>;

    pending(): Awaitable<TimeoutDetails[]>;
}
