import type { MessageFilter } from '@blargbot/domain/models/index.js';
import type * as eris from 'eris';

import { matchRegexSafe } from '../createRegExp.js';
import { humanize } from '../humanize/index.js';

export function matchMessageFilter(filter: MessageFilter, message: eris.KnownMessage): string[] | undefined {
    let content = message.content;
    if (filter.decancer === true)
        content = humanize.decancer(content);
    if (filter.regex)
        return matchRegexSafe(filter.term, content);

    if (content.toLowerCase().includes(filter.term.toLowerCase()))
        return [filter.term];
    return undefined;
}
