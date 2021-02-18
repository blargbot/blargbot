import { RethinkDb } from './core/RethinkDb';
import { StoredTag, TagsTable } from './types';
import { RethinkDbTable } from './core/RethinkDbTable';

export class RethinkDbTagTable extends RethinkDbTable<'tag'> implements TagsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('tag', rethinkDb, logger);
    }

    public async get(tagName: string): Promise<DeepReadOnly<StoredTag> | undefined> {
        return await this.rget(tagName);
    }

    public async incrementUses(tagName: string, count = 1): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            uses: r.row<number>('uses').default(0).add(count),
            lastuse: new Date()
        }));
    }
}