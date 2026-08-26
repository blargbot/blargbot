import type { EventOptionsTypeMap } from './EventOptionsTypeMap.js';

export type EventType = keyof EventOptionsTypeMap;
export type EventTypeMap = {
    [K in EventType]: EventOptionsTypeMap[K] & {
        readonly id: string;
        readonly type: K;
        readonly starttime: number;
    };
}
