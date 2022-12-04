import type { StoredEventOptionsBase } from './StoredEventOptionsBase.js';

export interface TimerEventOptions extends StoredEventOptionsBase {
    readonly channel: string;
    readonly user: string;
}
