import type { IFormattable } from '@blargbot/formatting';

import type { ClusterBBTagContextMetadata } from '../managers/BBTagManager.js';
import type { RuntimeLimitRule } from './RuntimeLimitRule.js';

export interface RuntimeLimit {
    readonly type: string;
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    check(context: ClusterBBTagContextMetadata, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): Array<IFormattable<string>>;
    serialize(): SerializedRuntimeLimit;
}

export interface SerializedRuntimeLimit {
    type: string;
    rules: { [key: string]: JToken[]; };
}
