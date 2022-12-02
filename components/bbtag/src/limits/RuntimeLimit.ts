import { IFormattable } from '@blargbot/formatting';

import { BBTagContext } from '../BBTagContext.js';
import { SerializedRuntimeLimit } from '../types.js';
import { RuntimeLimitRule } from './RuntimeLimitRule.js';

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly id: string;
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): Array<IFormattable<string>>;
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}
