import { MessageFilter } from '@core/types';
import { AnyMessage } from 'eris';

import { testRegexSafe } from '../createRegExp';

export function testMessageFilter(filter: MessageFilter, message: AnyMessage): boolean {
    if (filter.regex)
        return testRegexSafe(filter.term, message.content);
    return message.content.toLowerCase().includes(filter.term.toLowerCase());
}
