import { Logger } from '@core/Logger';
import { StoredTag, TagsTable } from '@core/types';

import { RethinkDb, RethinkDbTable } from './base';

export class RethinkDbTagTable extends RethinkDbTable<StoredTag> implements TagsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('tag', rethinkDb, logger);
    }

    public async list(skip: number, take: number): Promise<readonly string[]> {
        return await this.rqueryAll(t =>
            t.orderBy({ index: 'name' })
                .getField('name')
                .skip(skip)
                .limit(take));
    }

    public async count(): Promise<number> {
        return await this.rquery(t => t.count());
    }

    public async byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]> {
        return await this.rqueryAll(t =>
            t.getAll(userId, { index: 'author' })
                .orderBy({ index: 'name' })
                .getField('name')
                .skip(skip)
                .limit(take));
    }

    public async byAuthorCount(userId: string): Promise<number> {
        return await this.rquery(t =>
            t.getAll(userId, { index: 'author' })
                .count());
    }

    public async search(partialName: string, skip: number, take: number): Promise<readonly string[]> {
        const expr = partialName.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
        return await this.rqueryAll(t =>
            t.orderBy({ index: 'name' })
                .filter(r => r('name').match(`(?i)${expr}`).ne(null))
                .getField('name')
                .skip(skip)
                .limit(take));
    }

    public async searchCount(partialName: string): Promise<number> {
        const expr = partialName.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
        return await this.rquery(t =>
            t.filter(r => r('name').match(`(?i)${expr}`).ne(null))
                .count());
    }

    public async top(count: number): Promise<StoredTag[]> {
        return await this.rqueryAll((t, r) =>
            t.orderBy(r.desc('uses'))
                .limit(count));
    }

    public async get(tagName: string): Promise<StoredTag | undefined> {
        return await this.rget(tagName);
    }

    public async set(tag: StoredTag): Promise<boolean> {
        return await this.rset(tag.name, { ...tag, lastmodified: new Date() });
    }

    public async update(name: string, tag: Partial<StoredTag>): Promise<boolean> {
        return await this.rupdate(name, { ...tag, lastmodified: new Date() });
    }

    public async add(tag: StoredTag): Promise<boolean> {
        return await this.rinsert(tag);
    }

    public async delete(tagName: string): Promise<boolean> {
        return await this.rdelete(tagName);
    }

    public async disable(tagName: string, userId: string, reason: string): Promise<boolean> {
        return await this.rupdate(tagName, {
            content: '',
            deleted: true,
            deleter: userId,
            reason: reason,
            uses: 0,
            favourites: {}
        });
    }

    public async incrementUses(tagName: string, count = 1): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            uses: r('uses').default(0).add(count),
            lastuse: new Date()
        }));
    }

    public async incrementReports(tagName: string, count = 1): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            reports: r('reports').default(0).add(count)
        }));
    }

    public async getFavourites(userId: string): Promise<readonly string[]> {
        return await this.rqueryAll(t =>
            t.getAll(userId, { index: 'user_favourite' })
                .orderBy('name')
                .getField('name'));
    }

    public async setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean> {
        return await this.rupdate(tagName, {
            favourites: {
                [userId]: this.updateExpr(favourite ? true : undefined)
            }
        });
    }

    public async setProp<K extends keyof StoredTag>(tagName: string, key: K, value: StoredTag[K]): Promise<boolean> {
        return await this.rupdate(tagName, { [key]: this.setExpr(value) });
    }
}
