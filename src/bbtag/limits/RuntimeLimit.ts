import { BBTagContext } from '../BBTagContext';
import { SerializedRuntimeLimit } from '../types';
import { RuntimeLimitRule } from './RuntimeLimitRule';

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly scopeName: string;
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): string[];
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}
