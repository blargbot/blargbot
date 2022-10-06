import { StoredTag } from '@blargbot/domain/models';
import { TagStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';

import { RethinkDb } from '../clients';
import { RethinkDbTable } from '../tables/RethinkDbTable';

export class RethinkDbTagStore implements TagStore {
    readonly #table: RethinkDbTable<StoredTag>;

    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        this.#table = new RethinkDbTable(`tag`, rethinkDb, logger);
    }

    public async list(skip: number, take: number): Promise<readonly string[]> {
        return await this.#table.queryAll(t =>
            t.orderBy({ index: `name` })
                .getField(`name`)
                .skip(skip)
                .limit(take));
    }

    public async count(): Promise<number> {
        return await this.#table.query(t => t.count());
    }

    public async byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]> {
        return await this.#table.queryAll(t =>
            t.getAll(userId, { index: `author` })
                .orderBy(`name`)
                .getField(`name`)
                .skip(skip)
                .limit(take));
    }

    public async byAuthorCount(userId: string): Promise<number> {
        return await this.#table.query(t =>
            t.getAll(userId, { index: `author` })
                .count());
    }

    public async search(partialName: string, skip: number, take: number): Promise<readonly string[]> {
        const expr = partialName.replace(/[.?*+^$[\]\\(){}|-]/g, `\\$&`);
        return await this.#table.queryAll(t =>
            t.orderBy({ index: `name` })
                .filter(r => r(`name`).match(`(?i)${expr}`).ne(null))
                .getField(`name`)
                .skip(skip)
                .limit(take));
    }

    public async searchCount(partialName: string): Promise<number> {
        const expr = partialName.replace(/[.?*+^$[\]\\(){}|-]/g, `\\$&`);
        return await this.#table.query(t =>
            t.filter(r => r(`name`).match(`(?i)${expr}`).ne(null))
                .count());
    }

    public async top(count: number): Promise<StoredTag[]> {
        return await this.#table.queryAll((t, r) =>
            t.orderBy(r.desc(`uses`))
                .limit(count));
    }

    public async get(tagName: string): Promise<StoredTag | undefined> {
        return await this.#table.get(tagName);
    }

    public async set(tag: StoredTag): Promise<boolean> {
        return await this.#table.set(tag.name, { ...tag, lastmodified: new Date() });
    }

    public async update(name: string, tag: Partial<StoredTag>): Promise<boolean> {
        return await this.#table.update(name, { ...tag, lastmodified: new Date() });
    }

    public async add(tag: StoredTag): Promise<boolean> {
        return await this.#table.insert(tag);
    }

    public async delete(tagName: string): Promise<boolean> {
        return await this.#table.delete(tagName);
    }

    public async disable(tagName: string, userId: string, reason: string): Promise<boolean> {
        return await this.#table.update(tagName, {
            content: ``,
            deleted: true,
            deleter: userId,
            reason: reason,
            uses: 0,
            favourites: {}
        });
    }

    public async incrementUses(tagName: string, count = 1): Promise<boolean> {
        return await this.#table.update(tagName, r => ({
            uses: r(`uses`).default(0).add(count),
            lastuse: new Date()
        }));
    }

    public async incrementReports(tagName: string, count = 1): Promise<boolean> {
        return await this.#table.update(tagName, r => ({
            reports: r(`reports`).default(0).add(count)
        }));
    }

    public async getFavourites(userId: string): Promise<readonly string[]> {
        return await this.#table.queryAll(t =>
            t.getAll(userId, { index: `user_favourite` })
                .orderBy(`name`)
                .getField(`name`));
    }

    public async setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean> {
        return await this.#table.update(tagName, {
            favourites: {
                [userId]: this.#table.updateExpr(favourite ? true : undefined)
            }
        });
    }

    public async setProp<K extends keyof StoredTag>(tagName: string, key: K, value: StoredTag[K]): Promise<boolean> {
        return await this.#table.update(tagName, { [key]: this.#table.setExpr(value) });
    }
}
