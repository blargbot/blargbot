import { MessageFilter } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

import { testRegexSafe } from '../createRegExp';
import { humanize } from '../humanize';

export function testMessageFilter(filter: MessageFilter, message: KnownMessage): boolean {
    let content = message.content;
    if (filter.decancer === true)
        content = humanize.decancer(content);
    if (filter.regex)
        return testRegexSafe(filter.term, content);
    return content.toLowerCase().includes(filter.term.toLowerCase());
}
