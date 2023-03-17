import type { IVariableScopeProvider } from './VariableScopeProvider.js';

export interface IVariableNameParser<Context, Scope> {
    parse(context: Context, variable: string): { scope: Scope; name: string; };
}

export class VariableNameParser<Context, Scope> implements IVariableNameParser<Context, Scope> {
    readonly #scopes: Array<IVariableScopeProvider<Context, Scope>>;

    public constructor(scopes: Iterable<IVariableScopeProvider<Context, Scope>>) {
        this.#scopes = [...scopes].sort((a, b) => b.prefix.length - a.prefix.length);
    }

    public parse(context: Context, variable: string): { scope: Scope; name: string; } {
        const provider = this.#scopes.find(s => variable.startsWith(s.prefix));
        if (provider === undefined)
            throw new Error('Missing default variable scope');

        return {
            scope: provider.getScope(context),
            name: variable.slice(provider.prefix.length)
        };
    }

}
