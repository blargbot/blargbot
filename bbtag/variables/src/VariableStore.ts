export interface IVariableStore<Scope> {
    get(scope: Scope, name: string): Promise<JToken | undefined>;
    set(entries: Iterable<{ scope: Scope; name: string; value: JToken | undefined; }>): Promise<void>;
}
