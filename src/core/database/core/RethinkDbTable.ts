import { RethinkDb } from './RethinkDb';
import { RethinkTableMap, UpdateRequest } from '../types';
import { r } from './RethinkDb';

export abstract class RethinkDbTable<T extends keyof RethinkTableMap> {
    protected constructor(
        protected readonly table: T,
        protected readonly rethinkDb: RethinkDb,
        protected readonly logger: CatLogger
    ) {
    }
    protected async rget(
        key: string
    ): Promise<RethinkTableMap[T] | undefined> {
        return await this.rethinkDb.query(r => r.table(this.table).get<RethinkTableMap[T]>(key)) ?? undefined;
    }

    protected async rinsert(value: RethinkTableMap[T], applyChanges = false): Promise<boolean> {
        const result = await this.rethinkDb.query(r => r.table(this.table).insert(value, { returnChanges: applyChanges }));
        if (applyChanges && result.changes?.[0]?.new_val)
            Object.apply(value, result.changes?.[0].new_val);
        return result.inserted + result.unchanged > 0;
    }

    protected async rupdate(
        key: string,
        value: UpdateRequest<RethinkTableMap[T]> | ((r: r) => UpdateRequest<RethinkTableMap[T]>)
    ): Promise<boolean> {
        const getter = typeof value === 'function' ? value : () => value;
        const result = await this.rethinkDb.query(r => r.table(this.table).get(key).update(getter(r)));
        return result.replaced + result.unchanged > 0;
    }

    protected async rdelete(
        key: string | Partial<RethinkTableMap[T]>
    ): Promise<boolean> {
        const result = typeof key === 'string'
            ? await this.rethinkDb.query(r => r.table(this.table).get(key).delete())
            : await this.rethinkDb.query(r => r.table(this.table).delete(key));
        return result.deleted > 0;
    }

    public migrate(): Promise<void> {
        return Promise.resolve();
    }
}
