import { EventType, EventTypeMap } from './EventType';

export type StoredEvent<K extends EventType = EventType> = EventTypeMap[K];
