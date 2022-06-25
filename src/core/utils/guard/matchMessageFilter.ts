import { MessageFilter } from '@blargbot/domain/models';
import { KnownMessage } from 'eris';

import { matchRegexSafe } from '../createRegExp';
import { humanize } from '../humanize';

export function matchMessageFilter(filter: MessageFilter, message: KnownMessage): string[] | undefined {
    let content = message.content;
    if (filter.decancer === true)
        content = humanize.decancer(content);
    if (filter.regex)
        return matchRegexSafe(filter.term, content);

    if (content.toLowerCase().includes(filter.term.toLowerCase()))
        return [filter.term];
    return undefined;
}
