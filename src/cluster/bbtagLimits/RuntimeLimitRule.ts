import type { IFormattable } from '@blargbot/formatting';

import type { ClusterBBTagContextMetadata } from '../managers/BBTagManager.js';

export interface RuntimeLimitRule {
    check(metadata: ClusterBBTagContextMetadata, subtagName: string): Awaitable<void>;
    displayText(subtagName: string): IFormattable<string>;
    state(): JToken;
    load(state: JToken): void;
}
