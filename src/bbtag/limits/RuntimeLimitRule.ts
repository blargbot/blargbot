import { IFormattable } from '@blargbot/domain/messages/types';

import { BBTagContext } from '../BBTagContext';

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    displayText(subtagName: string): IFormattable<string>;
    state(): JToken;
    load(state: JToken): void;
}
