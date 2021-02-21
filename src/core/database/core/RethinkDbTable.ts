import { RethinkDb } from './RethinkDb';
import { RethinkTableMap } from '../types';
import { r } from './RethinkDb';
import { Expression } from 'rethinkdb';
import { WriteResult } from 'rethinkdb';

export type UpdateRequest<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [P in keyof T]?: T[P] | Expression<T[P]> | UpdateRequest<T[P]>
}

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
        throwIfErrored(result);
        return result.inserted > 0;
    }

    protected async rset(key: string, value: RethinkTableMap[T], applyChanges = false): Promise<boolean> {
        const result = await this.rethinkDb.query(r => r.table(this.table).get(key).replace(value, { returnChanges: applyChanges }));
        if (applyChanges && result.changes?.[0]?.new_val)
            Object.apply(value, result.changes?.[0].new_val);
        throwIfErrored(result);
        return result.inserted + result.replaced > 0;
    }

    protected async rupdate(
        key: string,
        value: UpdateRequest<RethinkTableMap[T]> | ((r: r) => UpdateRequest<RethinkTableMap[T]>)
    ): Promise<boolean> {
        const getter = typeof value === 'function' ? value : () => value;
        const result = await this.rethinkDb.query(r => r.table(this.table).get(key).update(getter(r)));
        throwIfErrored(result);
        return result.replaced + result.unchanged > 0;
    }

    protected async rdelete(
        key: string | Partial<RethinkTableMap[T]>
    ): Promise<boolean> {
        const result = typeof key === 'string'
            ? await this.rethinkDb.query(r => r.table(this.table).get(key).delete())
            : await this.rethinkDb.query(r => r.table(this.table).delete(key));
        throwIfErrored(result);
        return result.deleted > 0;
    }

    public migrate(): Promise<void> {
        return Promise.resolve();
    }
}

function throwIfErrored(result: WriteResult): void | never {
    if (result.errors === 0)
        return;

    const error = typeof result.first_error === 'string'
        ? new Error(result.first_error)
        : result.first_error;

    Error.captureStackTrace(error, throwIfErrored);
    throw error;
}