import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from '../BBTagContext.js';
import type { SerializedRuntimeLimit } from '../types.js';
import type { RuntimeLimitRule } from './RuntimeLimitRule.js';

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly id: string;
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): Array<IFormattable<string>>;
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}
