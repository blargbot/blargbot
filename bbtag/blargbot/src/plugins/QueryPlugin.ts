export abstract class QueryPlugin {
    public abstract query<T>(provider: QuerySource<T>, options: QueryOptions): Promise<T | undefined>;
}

export interface QuerySource<T> {
    readonly queryString: string;
    readonly cacheKey?: symbol;
    readonly type: string;
    readonly fetch: (id: string) => Promise<T | undefined>;
    readonly find: (query: string) => Promise<T[]>;
    readonly pick: (options: T[]) => Promise<QueryResult<T>>;
}

export type QueryResult<T> =
    | { readonly state: 'NO_OPTIONS' | 'TIMED_OUT' | 'CANCELLED' | 'FAILED'; }
    | { readonly state: 'SUCCESS'; readonly value: T; }

export interface QueryOptions {
    readonly noLookup?: boolean;
    readonly noErrors?: boolean;
}
