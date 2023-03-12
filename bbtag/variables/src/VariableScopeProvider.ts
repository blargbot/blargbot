export interface VariableScopeProvider<Context, Scope> {
    readonly prefix: string;
    getScope(context: Context): Scope;
}
