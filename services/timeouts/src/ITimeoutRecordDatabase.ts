import type { TimeoutRecord } from './TimeoutDetails.js';

export interface ITimeoutRecordDatabase {
    get(ownerId: bigint, id: string): Awaitable<TimeoutRecord | undefined>;
    create(record: Omit<TimeoutRecord, 'id'>): Awaitable<string>;
    delete(ownerId: bigint, id: string): Awaitable<void>;
    deleteAll(records: Iterable<{ ownerId: bigint; id: string; }>): Awaitable<void>;

    list(ownerId: bigint, offset: number, count: number): Awaitable<TimeoutRecord[]>;
    count(ownerId: bigint): Awaitable<number>;
    clear(ownerId: bigint): Awaitable<void>;

    pending(): Awaitable<TimeoutRecord[]>;
}
