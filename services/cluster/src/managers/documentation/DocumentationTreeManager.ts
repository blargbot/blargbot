import { format, IFormatter } from '@blargbot/formatting';
import Eris from 'eris';

import templates from '../../text.js';
import { Documentation, DocumentationManager } from './DocumentationManager.js';

export abstract class DocumentationTreeManager extends DocumentationManager {
    protected abstract getTree(user: Eris.User, channel: Eris.KnownTextableChannel): Awaitable<Documentation>;

    async * #getFlatTree(user: Eris.User, channel: Eris.KnownTextableChannel): AsyncGenerator<Documentation> {
        const tree = await this.getTree(user, channel);
        yield* expandAsync([tree], d => {
            if (d.type !== 'group')
                return [];

            return d.items.map(i => ({
                ...i,
                tags: [i.name, ...i.tags ?? []],
                name: templates.documentation.name.flat({ parent: d.name, child: i.name }),
                embed: {
                    ...i.embed,
                    color: i.embed.color ?? d.embed.color
                }
            }));
        });
    }

    #matchScore(documentation: Documentation, term: string, formatter: IFormatter): Awaitable<number> {
        const normTerm = term.trim().toLowerCase();
        return (documentation.tags ?? [documentation.name])
            .map(x => typeof x === 'string' ? x : x[format](formatter))
            .map(x => x.toLowerCase())
            .map(normTitle => {
                if (normTitle === normTerm)
                    return Number.MAX_SAFE_INTEGER;
                if (normTerm.length === 0)
                    return 0;
                if (normTitle.startsWith(normTerm))
                    return 2;
                if (normTitle.includes(normTerm))
                    return 1;
                return 0;
            })
            .reduce((p, c) => p < c ? c : p);
    }

    protected async findDocumentation(term: string, user: Eris.User, channel: Eris.KnownTextableChannel, formatter: IFormatter): Promise<readonly Documentation[]> {
        const matches: Array<{ item: Documentation; score: number; }> = [];
        for await (const item of this.#getFlatTree(user, channel)) {
            const score = await this.#matchScore(item, term, formatter);
            if (score > 0)
                matches.push({ item, score });
        }

        const exact = matches.filter(m => m.score === Number.MAX_SAFE_INTEGER);
        if (exact.length > 0)
            return exact.map(x => x.item);

        return matches.sort((a, b) => b.score - a.score).map(x => x.item);
    }

    protected async getDocumentation(documentationId: string, user: Eris.User, channel: Eris.KnownTextableChannel): Promise<Documentation | undefined> {
        for await (const item of this.#getFlatTree(user, channel))
            if (item.id === documentationId)
                return item;
        return undefined;
    }

    protected async getParent(documentationId: string, user: Eris.User, channel: Eris.KnownTextableChannel): Promise<Documentation | undefined> {
        for await (const item of this.#getFlatTree(user, channel))
            if (item.type === 'group' && item.items.some(i => i.id === documentationId))
                return item;
        return undefined;
    }
}

async function* expandAsync<T>(source: Iterable<T> | AsyncIterable<T>, selector: (value: T) => Iterable<T> | AsyncIterable<T>): AsyncGenerator<T> {
    async function* toAsync(source: Iterable<T> | AsyncIterable<T>): AsyncIterator<T> {
        yield* source;
    }

    const sources = [toAsync(source)];
    while (sources.length > 0) {
        const next = await sources[0].next();
        if (next.done === true)
            sources.shift();
        else {
            yield next.value;
            sources.unshift(toAsync(selector(next.value)));
        }
    }
}
