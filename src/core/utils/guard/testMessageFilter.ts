import { MessageFilter } from '@core/types';
import { Message } from 'discord.js';

import { testRegexSafe } from '../createRegExp';
import { decancer } from '../humanize';

export function testMessageFilter(filter: MessageFilter, message: Message): boolean {
    let content = message.content;
    if (filter.decancer === true)
        content = decancer(content);
    if (filter.regex)
        return testRegexSafe(filter.term, content);
    return content.toLowerCase().includes(filter.term.toLowerCase());
}
