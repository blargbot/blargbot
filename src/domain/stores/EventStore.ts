import type moment from 'moment-timezone';

import type { EventType, StoredEvent, StoredEventOptions } from '../models/index.js';

export interface EventStore {
    list(source: string, pageNumber: number, pageSize: number): Promise<{ events: readonly StoredEvent[]; total: number; }>;
    between(from: Date | moment.Moment | number, to: Date | moment.Moment | number): Promise<readonly StoredEvent[]>;
    add<K extends EventType>(type: K, event: StoredEventOptions<K>): Promise<StoredEvent<K> | undefined>;
    delete(eventId: string): Promise<boolean>;
    delete(filter: Partial<StoredEventOptions>): Promise<readonly string[]>;
    getIds(source: string): Promise<readonly string[]>;
    get(id: string): Promise<StoredEvent | undefined>;
}
