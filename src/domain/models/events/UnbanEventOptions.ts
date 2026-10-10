import type { StoredEventOptionsBase } from './StoredEventOptionsBase.js';

export interface UnbanEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}
