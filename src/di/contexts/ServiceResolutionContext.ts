import { IServiceScope, TransientServiceScope } from '../scopes';
import { IServiceProvider } from '../serviceProviders';
import { IServiceResolutionContext } from './IServiceResolutionContext';

export class ServiceResolutionContext implements IServiceResolutionContext {
    readonly #scoped: IServiceScope | undefined;

    public readonly singleton: IServiceScope;
    public readonly transient: IServiceScope;
    public provider: IServiceProvider;

    public get scoped(): IServiceScope {
        if (this.#scoped === undefined)
            throw new Error('There is no current scope.');
        return this.#scoped;
    }

    public constructor(provider: IServiceProvider, rootScope: IServiceScope, currentScope: IServiceScope | undefined) {
        this.provider = provider;
        this.singleton = rootScope;
        this.#scoped = currentScope;
        this.transient = new TransientServiceScope();
    }
}
