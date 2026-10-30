import type { EventOptionsTypeMap } from './EventOptionsTypeMap.js';
import type { EventType } from './EventType.js';

export type StoredEventOptions<K extends EventType = EventType> = EventOptionsTypeMap[K];
