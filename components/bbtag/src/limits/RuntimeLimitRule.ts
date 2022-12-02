import { IFormattable } from '@blargbot/formatting';

import { BBTagContext } from '../BBTagContext.js';

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    displayText(subtagName: string): IFormattable<string>;
    state(): JToken;
    load(state: JToken): void;
}
