import type { IFormattable } from '@blargbot/formatting';

import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { SerializedRuntimeLimit } from '../types.js';
import type { RuntimeLimitRule } from './RuntimeLimitRule.js';

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly id: string;
    check(context: BBTagRuntime, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): Array<IFormattable<string>>;
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}

export interface BBTagRuntimeGuard {
    readonly id: string;
    check(key: string): Awaitable<void>;
    state(): SerializedRuntimeLimit;
}
