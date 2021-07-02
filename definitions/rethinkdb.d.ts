declare module 'rethinkdb' {
    export function epochTime(time: number): Expression<Time>;
    export function literal<T>(value?: T): Expression<T>;

    interface WriteResult {
        changes?: WriteChange[];
    }

    interface WriteChange {
        new_val?: any;
        old_val?: any;
    }

    interface Sequence {
        changes(opts?: Partial<ChangesOptions>): Sequence
    }
    interface Expression<T> {
        append<E>(prop: E): Expression<E[]>;
        match: T extends string ? (re2: string) => Expression<string> : never;
    }

    interface Row extends Expression<any> {
        <T>(name: string): Expression<T>;
    }

    type Query<T> = (rethink: typeof import('rethinkdb')) => Operation<T>;
    type TableQuery<T> = (table: Table, rethink: typeof import('rethinkdb')) => Operation<T>;
    type UpdateRequest<T> = { [P in keyof T]?: T[P] | Expression<T[P]> | UpdateRequest<T[P]> }
}

