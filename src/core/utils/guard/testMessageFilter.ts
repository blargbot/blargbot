import { MessageFilter } from '@core/types';
import { KnownMessage } from 'eris';

import { testRegexSafe } from '../createRegExp';
import { decancer } from '../humanize';

export function testMessageFilter(filter: MessageFilter, message: KnownMessage): boolean {
    let content = message.content;
    if (filter.decancer === true)
        content = decancer(content);
    if (filter.regex)
        return testRegexSafe(filter.term, content);
    return content.toLowerCase().includes(filter.term.toLowerCase());
}
