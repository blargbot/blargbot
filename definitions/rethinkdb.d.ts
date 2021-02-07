declare module 'rethinkdb' {
    export function epochTime(time: number): Expression<Time>;
    export function literal(value: object): Literal;

    interface Literal { }

    interface WriteResult {
        changes?: WriteChange[];
    }

    interface WriteChange {
        new_val?: unknown;
        old_val?: unknown;
    }
}