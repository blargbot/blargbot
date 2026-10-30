import type { StoredEventOptionsBase } from './StoredEventOptionsBase.js';

export interface RemindEventOptions extends StoredEventOptionsBase {
    readonly channel: string;
    readonly user: string;
    readonly content: string;
}
