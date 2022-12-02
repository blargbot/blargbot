import { EventOptionsTypeMap } from './EventOptionsTypeMap.js';
import { EventType } from './EventType.js';

export type StoredEventOptions<K extends EventType = EventType> = EventOptionsTypeMap[K];
