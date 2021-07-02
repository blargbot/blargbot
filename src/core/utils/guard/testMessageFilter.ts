import { AnyMessage } from 'eris';
import { MessageFilter } from '../../database';
import { testRegexSafe } from '../createRegExp';

export function testMessageFilter(filter: MessageFilter, message: AnyMessage): boolean {
    if (filter.regex)
        return testRegexSafe(filter.term, message.content);
    return message.content.toLowerCase().includes(filter.term.toLowerCase());
}