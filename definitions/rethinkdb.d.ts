declare module 'rethinkdb' {
    export function epochTime(time: number): Expression<Time>;
    export function literal(value: object): Literal;

    interface Literal { }
}