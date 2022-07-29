import { KnownTextableChannel, User } from 'eris';

import { Documentation, DocumentationManager } from './DocumentationManager';

export abstract class DocumentationTreeManager extends DocumentationManager {
    protected abstract getTree(user: User, channel: KnownTextableChannel): Awaitable<Documentation>;

    async * #getFlatTree(user: User, channel: KnownTextableChannel): AsyncGenerator<Documentation> {
        const tree = await this.getTree(user, channel);
        yield* expandAsync([tree], d => {
            if (d.type !== 'group')
                return [];

            return d.items.map(i => ({
                ...i,
                tags: [i.name, ...i.tags ?? []],
                name: `${d.name} - ${i.name}`,
                embed: {
                    ...i.embed,
                    color: i.embed.color ?? d.embed.color
                }
            }));
        });
    }

    #matchScore(documentation: Documentation, term: string): Awaitable<number> {
        const normTerm = term.trim().toLowerCase();
        return (documentation.tags ?? [documentation.name]).map(x => x.toLowerCase())
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

    protected async findDocumentation(term: string, user: User, channel: KnownTextableChannel): Promise<readonly Documentation[]> {
        const matches: Array<{ item: Documentation; score: number; }> = [];
        for await (const item of this.#getFlatTree(user, channel)) {
            const score = await this.#matchScore(item, term);
            if (score > 0)
                matches.push({ item, score });
        }

        const exact = matches.filter(m => m.score === Number.MAX_SAFE_INTEGER);
        if (exact.length === 1)
            return exact.map(x => x.item);

        return matches.sort((a, b) => a.score - b.score).map(x => x.item);
    }

    protected async getDocumentation(documentationId: string, user: User, channel: KnownTextableChannel): Promise<Documentation | undefined> {
        for await (const item of this.#getFlatTree(user, channel))
            if (item.id === documentationId)
                return item;
        return undefined;
    }

    protected async getParent(documentationId: string, user: User, channel: KnownTextableChannel): Promise<Documentation | undefined> {
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
