import { EventType, EventTypeMap } from './EventType.js';

export type StoredEvent<K extends EventType = EventType> = EventTypeMap[K];
