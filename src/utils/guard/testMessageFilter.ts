import { AnyMessage } from 'eris';
import { testRegexSafe } from '../misc/createRegExp';

export function testMessageFilter(filter: MessageFilter, message: AnyMessage): boolean {
    if (filter.regex)
        return testRegexSafe(filter.term, message.content);
    return message.content.toLowerCase().includes(filter.term.toLowerCase());
}

export interface MessageFilter {
    readonly term: string;
    readonly regex: boolean;
}