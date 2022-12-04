import type { StoredEventOptionsBase } from './StoredEventOptionsBase.js';

export interface UnmuteEventOptions extends StoredEventOptionsBase {
    readonly guild: string;
    readonly user: string;
    readonly duration: string;
}
