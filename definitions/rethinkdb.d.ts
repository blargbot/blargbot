declare module 'rethinkdb' {
    export function epochTime(time: number): BetterExpression<Time>;
    export function literal<T>(): BetterExpression<T>;
    export function literal<T>(value: T): BetterExpression<T>;

    interface WriteResult {
        changes?: WriteChange[];
    }

    interface WriteChange {
        /* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any */
        new_val?: any;
        old_val?: any;
        /* eslint-enable @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any */
    }

    interface Sequence {
        changes(opts?: Partial<ChangesOptions>): Sequence;
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

    interface BetterRow<T> extends BetterExpression<T> {
        <R extends keyof T>(name: R): BetterExpression<T[R]>;
    }

    type RethinkDb = typeof import('rethinkdb');
    interface BetterRethinkDb<T> extends RethinkDb {
        readonly row: BetterRow<T>;
    }

    interface Table {
        getAll(...args: [...unknown[], { index: string; }]): Sequence;
    }

    type Query<T> = (rethink: RethinkDb) => Operation<T>;
    type TableQuery<T, R> = (table: Table, rethink: BetterRethinkDb<R>) => Operation<T>;
    type UpdateRequest<T> = { [P in keyof T]?: T[P] | BetterExpression<T[P]> | UpdateRequest<T[P]> } | BetterExpression<T>;
    type UpdateData<T> = UpdateRequest<T> | ((r: BetterRethinkDb<T>) => UpdateRequest<T>);
}
