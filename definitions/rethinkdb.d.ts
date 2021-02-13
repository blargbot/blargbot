declare module 'rethinkdb' {
    export function epochTime(time: number): Expression<Time>;
    export function literal(value: object): Literal;

    interface Literal { }

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
}