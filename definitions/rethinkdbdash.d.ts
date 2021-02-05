
declare module 'rethinkdbdash' {
    import * as rethinkdb from 'rethinkdb';
    import * as Promise from 'bluebird';

    type O<T> = rethinkdb.Operation<T>;


    interface _r {
        table(tableName: string): rethinkdb.Table;
        connect(): Promise<void>
    }

    interface SlimPromise<T> {
        then: Promise<T>['then'];
        catch: Promise<T>['catch'];
        finally: Promise<T>['finally'];
    }

    export interface r extends Dash<_r> { }

    export type Dash<T> = {
        [P in keyof T]
        : T[P] extends O<infer R> ? T[P] & Promise<R>
        : T[P] extends (...args: infer I) => O<infer R> ? (...args: I) => Dash<ReturnType<T[P]>> & SlimPromise<R>
        : T[P] extends (...args: infer I) => O<infer R> ? (...args: I) => Dash<ReturnType<T[P]>> & SlimPromise<R>
        : T[P] extends (...args: infer I) => infer R ? (...args: I) => Dash<R>
        : T[P]
    }

    export interface RethinkDbOptions {
        host?: string;
        db?: string;
        password?: string;
        user?: string;
        port?: number;
        max?: number;
        buffer?: number;
        timeoutError?: number;
    }

    export default function main(options: RethinkDbOptions): r;
}