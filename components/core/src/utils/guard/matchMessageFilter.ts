import { decancer } from '@blargbot/decancer';
import type { MessageFilter } from '@blargbot/domain/models/index.js';
import type * as Eris from 'eris';

import { createSafeRegExp } from '../createSafeRegExp.js';

export function matchMessageFilter(filter: MessageFilter, message: Eris.KnownMessage): string[] | undefined {
    let content = message.content;
    if (filter.decancer === true)
        content = decancer(content);
    if (filter.regex) {
        const regex = createSafeRegExp(filter.term);
        if (!regex.success)
            return undefined;
        return content.match(regex.value) ?? undefined;
    }

    if (content.toLowerCase().includes(filter.term.toLowerCase()))
        return [filter.term];
    return undefined;
}
