import { IFormattable } from '@blargbot/domain/messages/types';

import { BBTagContext } from '../BBTagContext';
import { SerializedRuntimeLimit } from '../types';
import { RuntimeLimitRule } from './RuntimeLimitRule';

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly id: string;
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): Array<IFormattable<string>>;
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}
