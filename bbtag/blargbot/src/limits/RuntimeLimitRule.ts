import type { IFormattable } from '@blargbot/formatting';

import type { BBTagRuntime } from '../BBTagRuntime.js';

export interface RuntimeLimitRule {
    check(context: BBTagRuntime, subtagName: string): Awaitable<void>;
    displayText(subtagName: string): IFormattable<string>;
    state(): JToken;
    load(state: JToken): void;
}
