import type { StoredEventOptionsBase } from './StoredEventOptionsBase.js';

export interface TagEventOptions extends StoredEventOptionsBase {
    readonly version: 4 | 3 | 2 | 1 | 0 | undefined;
    readonly source: string;
    readonly context: string;
    readonly content: string;
}
