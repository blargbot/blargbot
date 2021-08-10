import { MessageFilter } from '@core/types';
import { Message } from 'discord.js';

import { testRegexSafe } from '../createRegExp';

export function testMessageFilter(filter: MessageFilter, message: Message): boolean {
    if (filter.regex)
        return testRegexSafe(filter.term, message.content);
    return message.content.toLowerCase().includes(filter.term.toLowerCase());
}
