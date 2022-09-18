import { MessageFilter } from '@blargbot/domain/models';
import { KnownMessage } from 'eris';

import { matchRegexSafe } from '../createRegExp';
import { humanize } from '../humanize';

export function matchMessageFilter(filter: MessageFilter, message: KnownMessage): string[] | undefined {
    for (let content of getCensorTargets(message)) {
        if (content === undefined)
            continue;
        if (filter.decancer === true)
            content = humanize.decancer(content);

        if (filter.regex) {
            const match = matchRegexSafe(filter.term, content);
            if (match !== undefined)
                return match;
        } else if (content.toLowerCase().includes(filter.term.toLowerCase()))
            return [filter.term];
    }
    return undefined;
}

function* getCensorTargets(message: KnownMessage): Generator<string | undefined> {
    yield message.content;
    for (const embed of message.embeds) {
        yield embed.description;
        yield embed.title;
        if (embed.fields !== undefined) {
            for (const field of embed.fields) {
                yield field.name;
                yield field.value;
            }
        }
        yield embed.footer?.text;
        yield embed.author?.name;
    }
    if (message.components !== undefined) {
        for (const row of message.components) {
            for (const component of row.components) {
                switch (component.type) {
                    case 2: {
                        yield component.label;
                        break;
                    }
                    case 3: {
                        yield component.placeholder;
                        for (const option of component.options) {
                            yield option.description;
                            yield option.label;
                        }
                        break;
                    }
                }
            }
        }
    }
}
