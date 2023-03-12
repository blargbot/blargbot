import type { VariableNameParser } from './VariableNameParser.js';
import type { VariableStore } from './VariableStore.js';

export interface VariableProviderMiddleware<Context, Scope> {
    get?: (context: Context, variable: string, next: () => Awaitable<{ scope: Scope; value: JToken | undefined; }>) => Awaitable<{ scope: Scope; value: JToken | undefined; }>;
    set?: (context: Context, values: Iterable<{ name: string; value: JToken | undefined; }>, next: () => Awaitable<void>) => Awaitable<void>;
}

export class VariableProvider<Context, Scope> {
    readonly #parser: VariableNameParser<Context, Scope>;
    readonly #database: VariableStore<Scope>;
    public get: (context: Context, variable: string) => Awaitable<{ scope: Scope; value: JToken | undefined; }>;
    public set: (context: Context, values: Iterable<{ name: string; value: JToken | undefined; }>) => Awaitable<void>;

    public constructor(
        parser: VariableNameParser<Context, Scope>,
        database: VariableStore<Scope>,
        middleware: Iterable<VariableProviderMiddleware<Context, Scope>> = []) {
        this.#parser = parser;
        this.#database = database;
        const get = [];
        const set = [];
        for (const m of middleware) {
            if (m.get !== undefined)
                get.push(m.get.bind(m));
            if (m.set !== undefined)
                set.push(m.set.bind(m));
        }

        this.get = get.reduceRight<VariableProvider<Context, Scope>['get']>((p, c) => (...args) => c(...args, p.bind(null, ...args)), async (context, variable) => {
            const { scope, name } = this.#parser.parse(context, variable);
            return { scope, value: await this.#database.get(scope, name) };
        });
        this.set = set.reduceRight<VariableProvider<Context, Scope>['set']>((p, c) => (...args) => c(...args, p.bind(null, ...args)), async (context, values) => {
            const toSet = Array.from(values, ({ name, value }) => ({ ...this.#parser.parse(context, name), value }));
            if (toSet.length === 0)
                return;

            await this.#database.set(toSet);
        });
    }

}
