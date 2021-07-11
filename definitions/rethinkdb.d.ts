declare module 'rethinkdb' {
    export function epochTime(time: number): BetterExpression<Time>;
    export function literal<T>(): BetterExpression<T>;
    export function literal<T>(value: T): BetterExpression<T>;

    interface WriteResult {
        changes?: WriteChange[];
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    interface WriteChange<T = any> {
        /* eslint-enable @typescript-eslint/no-explicit-any */
        /* eslint-disable @typescript-eslint/naming-convention */
        new_val?: T;
        old_val?: T;
        /* eslint-enable @typescript-eslint/naming-convention */
    }

    type Sanitized<T> = T extends Array<infer R | undefined> ? R[] : T;
    type AppendValue<T> = T extends Array<infer R> ? R : never;
    type SpliceReplacement<T> = T extends Array<infer R> ? R[] : never;
    interface BetterExpression<T> extends Expression<T> {
        append(prop: string): BetterExpression<T>;
        append(prop: AppendValue<T>): BetterExpression<T>;
        spliceAt(index: number, replacement: SpliceReplacement<T>): BetterExpression<T>;
        match: T extends string ? (re2: string) => BetterExpression<string> : never;
        getField<K extends keyof T>(name: K): BetterExpression<T[K]>;
        <K extends keyof T>(name: K): BetterExpression<T[K]>;
        default(value: Exclude<T, undefined | null>): BetterExpression<Exclude<T, undefined | null>>;
        add(value: number): BetterExpression<number>;
        add(value: Expression<number>): BetterExpression<number>;
    }

    interface BetterExpressionFunction<T, R> {
        (doc: BetterExpression<T>): Expression<R>;
    }

    interface BetterRow<T> extends BetterExpression<T> {
        <R extends keyof T>(name: R): BetterExpression<T[R]>;
    }

    type RethinkDb = typeof import('rethinkdb');
    interface BetterRethinkDb<T> extends RethinkDb {
        readonly row: BetterRow<T>;
        table<T>(tableName: string): BetterTable<T>;
    }

    interface BetterCursor<T> extends Cursor {
        toArray(): Promise<T[]>;
        next(): Promise<T>;
    }

    interface BetterSequence<T> extends Operation<BetterCursor<T>>, Omit<Sequence, keyof Operation<BetterCursor<T>>> {
        between(lower: unknown, upper: unknown, index?: Index): BetterSequence<T>;
        coerceTo(key: 'array'): Expression<T[]>;
        coerceTo(key: 'object'): Expression<T>;
        filter(rql: BetterExpressionFunction<T, boolean>): BetterSequence<T>;
        filter(rql: BetterExpression<boolean>): BetterSequence<T>;
        filter(obj: { [key: string]: unknown; }): BetterSequence<T>;
        changes(opts?: Partial<ChangesOptions>): BetterSequence<WriteChange<T>>;
        orderBy(...keys: string[]): BetterSequence<T>;
        orderBy(...sorts: Sort[]): BetterSequence<T>;
        skip(n: number): BetterSequence<T>;
        limit(n: number): BetterSequence<T>;
        slice(start: number, end?: number): BetterSequence<T>;
        nth(n: number): Expression<T>;
        isEmpty(): Expression<boolean>;
        sample(n: number): BetterSequence<T>;
        getField<K extends string & keyof T>(prop: K): BetterSequence<K>;
        count(): Expression<number>;
        distinct(opts?: { index: string; }): BetterSequence<T>;
        contains(prop: string & keyof T): Expression<boolean>;
        pluck<K extends string & keyof T>(...props: K[]): BetterSequence<Pick<T, K>>;
        without<K extends string & keyof T>(...props: K[]): BetterSequence<Omit<T, K>>;
    }

    interface BetterTable<T> extends BetterSequence<T>, Omit<Table, keyof BetterSequence<T> | 'getAll' | 'get'> {
        getAll(...args: unknown[]): BetterSequence<T>;
        getAll(...args: [...unknown[], Index]): BetterSequence<T>;
        get(key: string): Operation<T | null> & Writeable;
    }

    type Query<T, R = unknown> = (rethink: BetterRethinkDb<R>) => Operation<T>;
    type TableQuery<T, R> = (table: BetterTable<R>, rethink: BetterRethinkDb<R>) => Operation<T>;
    type UpdateRequest<T> = { [P in keyof T]?: T[P] | BetterExpression<T[P]> | UpdateRequest<T[P]> } | BetterExpression<T>;
    type UpdateData<T> = UpdateRequest<T> | ((r: BetterRethinkDb<T>) => UpdateRequest<T>);
}
