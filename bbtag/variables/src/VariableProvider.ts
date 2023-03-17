import type { IVariableNameParser } from './VariableNameParser.js';
import type { IVariableStore } from './VariableStore.js';

export interface VariableProviderMiddleware<Context, Scope> {
    get?: (context: Context, variable: string, next: () => Awaitable<{ scope: Scope; value: JToken | undefined; }>) => Awaitable<{ scope: Scope; value: JToken | undefined; }>;
    set?: (context: Context, values: Iterable<{ name: string; value: JToken | undefined; }>, next: () => Awaitable<void>) => Awaitable<void>;
}

export interface IVariableProvider<Context, Scope> {
    get(context: Context, variable: string): Awaitable<{ scope: Scope; value: JToken | undefined; }>;
    set(context: Context, values: Iterable<{ name: string; value: JToken | undefined; }>): Awaitable<void>;
}

export class VariableProvider<Context, Scope> implements IVariableProvider<Context, Scope> {
    readonly #parser: IVariableNameParser<Context, Scope>;
    readonly #database: IVariableStore<Scope>;

    public constructor(parser: IVariableNameParser<Context, Scope>, database: IVariableStore<Scope>) {
        this.#parser = parser;
        this.#database = database;
    }

    public async get(context: Context, variable: string): Promise<{ scope: Scope; value: JToken | undefined; }> {
        const { scope, name } = this.#parser.parse(context, variable);
        return { scope, value: await this.#database.get(scope, name) };
    }

    public async set(context: Context, values: Iterable<{ name: string; value: JToken | undefined; }>): Promise<void> {
        const toSet = Array.from(values, ({ name, value }) => ({ ...this.#parser.parse(context, name), value }));
        if (toSet.length === 0)
            return;

        await this.#database.set(toSet);
    }
}
