export interface IVariableScopeProvider<Context, Scope> {
    readonly prefix: string;
    getScope(context: Context): Scope;
}
