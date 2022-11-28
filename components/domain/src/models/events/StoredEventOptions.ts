import { EventOptionsTypeMap } from './EventOptionsTypeMap';
import { EventType } from './EventType';

export type StoredEventOptions<K extends EventType = EventType> = EventOptionsTypeMap[K];
